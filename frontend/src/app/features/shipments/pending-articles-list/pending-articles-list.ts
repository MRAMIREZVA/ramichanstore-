import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ShipmentItem } from '../../../core/models/shipment.model';
import { ShipmentService } from '../../../core/services/shipment.service';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { PendingArticleFormComponent, PendingArticleFormData } from '../pending-article-form/pending-article-form';

/**
 * Pool de artículos pre-registrados que todavía no pertenecen a ningún
 * embarque (Fase 40) — se registran acá apenas llegan al almacén de
 * consolidación, y en el formulario de embarque se buscan por código en vez
 * de volver a tipear todo.
 */
@Component({
  selector: 'app-pending-articles-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './pending-articles-list.html',
  styleUrl: './pending-articles-list.scss',
})
export class PendingArticlesList implements OnInit {
  private readonly shipmentService = inject(ShipmentService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly displayedColumns = ['code', 'description', 'quantity', 'weight', 'cost', 'actions'];
  readonly searchControl = new FormControl('');

  readonly loading = signal(true);
  readonly items = signal<ShipmentItem[]>([]);
  readonly totalElements = signal(0);

  page = 0;
  pageSize = 20;

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(debounceTime(350), distinctUntilChanged()).subscribe(() => {
      this.page = 0;
      this.load();
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.shipmentService
      .searchPendingItems({ search: this.searchControl.value || undefined, page: this.page, size: this.pageSize })
      .subscribe({
        next: (res) => {
          this.items.set(res.data.content);
          this.totalElements.set(res.data.totalElements);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  openCreate(): void {
    this.openForm(null);
  }

  openEdit(item: ShipmentItem): void {
    this.openForm(item);
  }

  private openForm(item: ShipmentItem | null): void {
    const data: PendingArticleFormData = { item };
    const ref = this.dialog.open(PendingArticleFormComponent, { data, width: '560px', maxWidth: '95vw', autoFocus: false });
    ref.afterClosed().subscribe((changed) => {
      if (changed) this.load();
    });
  }

  confirmDelete(item: ShipmentItem): void {
    const data: ConfirmDialogData = {
      title: 'Eliminar artículo',
      message: `¿Eliminar el artículo "${item.articleCode}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    };
    const ref = this.dialog.open(ConfirmDialog, { data, width: '420px' });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.shipmentService.deletePendingItem(item.id).subscribe({
        next: (res) => {
          this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
          this.load();
        },
      });
    });
  }
}

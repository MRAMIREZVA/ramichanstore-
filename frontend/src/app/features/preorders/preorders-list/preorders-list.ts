import { KeyValuePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { PREORDER_STATUS_LABELS, Preorder, PreorderStatus } from '../../../core/models/preorder.model';
import { resolveImageUrl } from '../../../core/utils/image-url';
import { PreorderFilters, PreorderService } from '../../../core/services/preorder.service';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { PreorderFormComponent, PreorderFormData } from '../preorder-form/preorder-form';
import { PreorderReservationsComponent, PreorderReservationsData } from '../preorder-reservations/preorder-reservations';

@Component({
  selector: 'app-preorders-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    KeyValuePipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './preorders-list.html',
  styleUrl: './preorders-list.scss',
})
export class PreordersList implements OnInit {
  private readonly preorderService = inject(PreorderService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly statusLabels = PREORDER_STATUS_LABELS;
  readonly resolveImageUrl = resolveImageUrl;
  readonly displayedColumns = ['image', 'product', 'price', 'slots', 'dates', 'status', 'actions'];

  readonly loading = signal(true);
  readonly preorders = signal<Preorder[]>([]);
  readonly totalElements = signal(0);

  readonly searchControl = new FormControl('');
  readonly statusControl = new FormControl<PreorderStatus | null>(null);

  page = 0;
  pageSize = 20;

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(debounceTime(350), distinctUntilChanged()).subscribe(() => {
      this.page = 0;
      this.load();
    });
    this.statusControl.valueChanges.subscribe(() => {
      this.page = 0;
      this.load();
    });

    this.load();
  }

  load(): void {
    this.loading.set(true);
    const filters: PreorderFilters = {
      search: this.searchControl.value ?? undefined,
      status: this.statusControl.value,
      page: this.page,
      size: this.pageSize,
    };
    this.preorderService.search(filters).subscribe({
      next: (res) => {
        this.preorders.set(res.data.content);
        this.totalElements.set(res.data.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  statusLabel(status: PreorderStatus): string {
    return this.statusLabels[status];
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  openCreate(): void {
    this.openForm(null);
  }

  openEdit(preorder: Preorder): void {
    this.openForm(preorder);
  }

  openReservations(preorder: Preorder): void {
    const data: PreorderReservationsData = { preorder };
    const ref = this.dialog.open<PreorderReservationsComponent, PreorderReservationsData, boolean>(
      PreorderReservationsComponent,
      { data, width: '760px', maxWidth: '95vw', autoFocus: false },
    );
    ref.afterClosed().subscribe((changed) => {
      if (changed) {
        this.load();
      }
    });
  }

  private openForm(preorder: Preorder | null): void {
    const ref = this.dialog.open<PreorderFormComponent, PreorderFormData, boolean>(PreorderFormComponent, {
      data: { preorder },
      width: '760px',
      maxWidth: '95vw',
      autoFocus: false,
    });
    ref.afterClosed().subscribe((changed) => {
      if (changed) {
        this.load();
      }
    });
  }

  confirmDelete(preorder: Preorder): void {
    const data: ConfirmDialogData = {
      title: 'Eliminar preventa',
      message: `¿Seguro que deseas eliminar la preventa de "${preorder.productName}"? Las reservas existentes se conservan en el historial.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    };
    const ref = this.dialog.open(ConfirmDialog, { data, width: '420px' });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.preorderService.delete(preorder.id).subscribe({
        next: (res) => {
          this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
          this.load();
        },
      });
    });
  }
}

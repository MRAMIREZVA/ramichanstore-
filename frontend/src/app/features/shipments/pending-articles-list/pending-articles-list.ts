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
import { SHIPMENT_STATUS_LABELS, ShipmentItem, ShipmentStatus } from '../../../core/models/shipment.model';
import { ShipmentService } from '../../../core/services/shipment.service';
import { ImagePreviewDialogComponent } from '../../../shared/components/image-preview-dialog/image-preview-dialog';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { PendingArticleFormComponent, PendingArticleFormData } from '../pending-article-form/pending-article-form';

/**
 * Artículos de embarque pre-registrados (Fase 40) — se registran acá apenas
 * llegan al almacén de consolidación, y en el formulario de embarque se
 * buscan por código en vez de volver a tipear todo. Desde Fase 69 esta
 * pantalla ("Artículos comprados") es un buscador GENERAL: muestra tanto los
 * que siguen sin asignar (pool pendiente) como los que ya quedaron dentro de
 * un embarque, con el estado real de ese embarque — editar/eliminar solo
 * están disponibles para los que siguen pendientes (el backend rechaza
 * tocar un artículo ya asignado desde acá, hay que hacerlo desde el propio
 * embarque).
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

  readonly displayedColumns = ['code', 'description', 'quantity', 'weight', 'costs', 'status', 'actions'];
  readonly searchControl = new FormControl('');
  readonly statusLabels = SHIPMENT_STATUS_LABELS;

  readonly loading = signal(true);
  readonly items = signal<ShipmentItem[]>([]);
  readonly totalElements = signal(0);
  /** id del artículo cuya imagen se está trayendo — muestra un spinner solo en ese botón. */
  readonly loadingImageId = signal<number | null>(null);

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
      .searchPendingItems({
        search: this.searchControl.value || undefined,
        onlyPending: false,
        page: this.page,
        size: this.pageSize,
      })
      .subscribe({
        next: (res) => {
          this.items.set(res.data.content);
          this.totalElements.set(res.data.totalElements);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  statusLabel(status: ShipmentStatus): string {
    return this.statusLabels[status] ?? status;
  }

  viewImage(item: ShipmentItem): void {
    if (!item.imageUrl || this.loadingImageId() !== null) return;
    this.loadingImageId.set(item.id);
    this.shipmentService.getItemImageBlob(item.id).subscribe({
      next: (blob) => {
        this.loadingImageId.set(null);
        const objectUrl = URL.createObjectURL(blob);
        const ref = this.dialog.open(ImagePreviewDialogComponent, {
          data: { imageUrl: objectUrl, title: item.description || 'Foto del artículo' },
          width: '500px',
          maxWidth: '90vw',
          autoFocus: false,
        });
        ref.afterClosed().subscribe(() => URL.revokeObjectURL(objectUrl));
      },
      error: () => this.loadingImageId.set(null),
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

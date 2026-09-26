import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ShipmentItem, ShipmentItemRequest } from '../../../core/models/shipment.model';
import { ShipmentService } from '../../../core/services/shipment.service';
import { ImagePreviewDialogComponent } from '../../../shared/components/image-preview-dialog/image-preview-dialog';

export interface PendingArticleFormData {
  item: ShipmentItem | null;
}

/**
 * Alta/edición de un artículo pre-registrado (Fase 40) — código, descripción,
 * cantidad, peso (obligatorio) y el desglose de costo (costo/comisión/recargo
 * por transacción, todos opcionales). La foto solo se puede subir editando un
 * artículo ya guardado (necesita un id real) — mismo patrón que "Duplicar
 * producto"/artículos nuevos de un embarque ("Guarda primero para subir la foto").
 */
@Component({
  selector: 'app-pending-article-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './pending-article-form.html',
  styleUrl: './pending-article-form.scss',
})
export class PendingArticleFormComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly shipmentService = inject(ShipmentService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly dialogRef = inject(MatDialogRef<PendingArticleFormComponent>);
  readonly data = inject<PendingArticleFormData>(MAT_DIALOG_DATA);

  private readonly item = this.data.item;

  readonly saving = signal(false);
  readonly uploadingImage = signal(false);
  readonly imageUrl = signal<string | null>(null);
  readonly imageObjectUrl = signal<string | null>(null);
  readonly itemId = this.item?.id ?? null;

  readonly form = this.fb.group({
    articleCode: [this.item?.articleCode ?? '', [Validators.required, Validators.maxLength(50)]],
    description: [this.item?.description ?? '', [Validators.required, Validators.maxLength(300)]],
    quantity: [this.item?.quantity ?? 1, [Validators.required, Validators.min(1)]],
    weight: [this.item?.weight ?? null, [Validators.required, Validators.min(0)]],
    cost: [this.item?.cost ?? null, Validators.min(0)],
    commission: [this.item?.commission ?? null, Validators.min(0)],
    transactionSurcharge: [this.item?.transactionSurcharge ?? null, Validators.min(0)],
  });

  constructor() {
    if (this.item?.imageUrl) {
      this.imageUrl.set(this.item.imageUrl);
      this.shipmentService.getItemImageBlob(this.item.id).subscribe({
        next: (blob) => this.imageObjectUrl.set(URL.createObjectURL(blob)),
        error: () => {},
      });
    }
  }

  ngOnDestroy(): void {
    const url = this.imageObjectUrl();
    if (url) URL.revokeObjectURL(url);
  }

  viewImage(): void {
    const url = this.imageObjectUrl();
    if (!url) return;
    this.dialog.open(ImagePreviewDialogComponent, {
      data: { imageUrl: url, title: this.form.controls.description.value || 'Foto del artículo' },
      width: '500px',
      maxWidth: '90vw',
      autoFocus: false,
    });
  }

  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    (event.target as HTMLInputElement).value = '';
    if (!file || !this.itemId) return;

    if (file.size > 5 * 1024 * 1024) {
      this.snackBar.open('La imagen no debe superar 5MB', 'Cerrar', { duration: 3000 });
      return;
    }

    this.uploadingImage.set(true);
    this.shipmentService.uploadItemImage(this.itemId, file).subscribe({
      next: () => {
        const prev = this.imageObjectUrl();
        if (prev) URL.revokeObjectURL(prev);
        this.uploadingImage.set(false);
        this.imageObjectUrl.set(URL.createObjectURL(file));
        this.imageUrl.set('set');
      },
      error: () => this.uploadingImage.set(false),
    });
  }

  removeImage(): void {
    if (!this.itemId) return;
    this.uploadingImage.set(true);
    this.shipmentService.deleteItemImage(this.itemId).subscribe({
      next: () => {
        const prev = this.imageObjectUrl();
        if (prev) URL.revokeObjectURL(prev);
        this.uploadingImage.set(false);
        this.imageObjectUrl.set(null);
        this.imageUrl.set(null);
      },
      error: () => this.uploadingImage.set(false),
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const request: ShipmentItemRequest = {
      id: this.itemId,
      articleCode: v.articleCode!.trim(),
      description: v.description!.trim(),
      quantity: Number(v.quantity),
      weight: Number(v.weight),
      cost: v.cost !== null && v.cost !== undefined ? Number(v.cost) : null,
      commission: v.commission !== null && v.commission !== undefined ? Number(v.commission) : null,
      transactionSurcharge:
        v.transactionSurcharge !== null && v.transactionSurcharge !== undefined ? Number(v.transactionSurcharge) : null,
    };

    this.saving.set(true);
    const obs = this.itemId
      ? this.shipmentService.updatePendingItem(this.itemId, request)
      : this.shipmentService.createPendingItem(request);
    obs.subscribe({
      next: (res) => {
        this.saving.set(false);
        this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: () => this.saving.set(false),
    });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}

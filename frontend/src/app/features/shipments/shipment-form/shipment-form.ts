import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  SHIPMENT_STATUS_LABELS,
  SHIPMENT_TYPE_LABELS,
  Shipment,
  ShipmentHolder,
  ShipmentRecipient,
  ShipmentRequest,
  ShipmentStatus,
  ShipmentType,
} from '../../../core/models/shipment.model';
import { ShipmentHolderService } from '../../../core/services/shipment-holder.service';
import { ShipmentRecipientService } from '../../../core/services/shipment-recipient.service';
import { ShipmentService } from '../../../core/services/shipment.service';
import { ImagePreviewDialogComponent } from '../../../shared/components/image-preview-dialog/image-preview-dialog';

export interface ShipmentFormData {
  shipment: Shipment | null;
}

interface ShipmentItemDraft {
  id: number | null;
  articleCode: string;
  description: string;
  quantity: number;
  imageUrl: string | null;
  /** Object URL local (blob) para mostrar la foto ya subida — la ruta del backend no es pública, no sirve como [src] directo. */
  imageObjectUrl: string | null;
  uploadingImage: boolean;
}

function emptyItem(): ShipmentItemDraft {
  return {
    id: null,
    articleCode: '',
    description: '',
    quantity: 1,
    imageUrl: null,
    imageObjectUrl: null,
    uploadingImage: false,
  };
}

@Component({
  selector: 'app-shipment-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './shipment-form.html',
  styleUrl: './shipment-form.scss',
})
export class ShipmentFormComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly shipmentService = inject(ShipmentService);
  private readonly shipmentHolderService = inject(ShipmentHolderService);
  private readonly shipmentRecipientService = inject(ShipmentRecipientService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<ShipmentFormComponent>);
  private readonly dialog = inject(MatDialog);
  readonly data = inject<ShipmentFormData>(MAT_DIALOG_DATA);

  readonly typeOptions = Object.entries(SHIPMENT_TYPE_LABELS) as [ShipmentType, string][];
  readonly statusOptions = Object.entries(SHIPMENT_STATUS_LABELS) as [ShipmentStatus, string][];

  readonly saving = signal(false);
  readonly holders = signal<ShipmentHolder[]>([]);
  readonly recipients = signal<ShipmentRecipient[]>([]);
  readonly items = signal<ShipmentItemDraft[]>(
    this.data.shipment?.items.map((i) => ({
      id: i.id,
      articleCode: i.articleCode ?? '',
      description: i.description,
      quantity: i.quantity,
      imageUrl: i.imageUrl,
      imageObjectUrl: null,
      uploadingImage: false,
    })) ?? [emptyItem()],
  );

  private readonly s = this.data.shipment;

  readonly form = this.fb.group({
    code: [this.s?.code ?? '', [Validators.required, Validators.maxLength(50)]],
    holderId: [this.s?.holderId ?? null, Validators.required],
    recipientId: [this.s?.recipientId ?? null, Validators.required],
    zenOrderNumber: [this.s?.zenOrderNumber ?? ''],
    shipmentType: [this.s?.shipmentType ?? ('BARCO' as ShipmentType), Validators.required],
    status: [this.s?.status ?? ('PENDIENTE_ENVIO' as ShipmentStatus), Validators.required],
    departureDate: [this.s?.departureDate ? new Date(this.s.departureDate) : null],
    arrivalDate: [this.s?.arrivalDate ? new Date(this.s.arrivalDate) : null],
    travelDays: [this.s?.travelDays ?? null],
    possibleArrivalDate: [this.s?.possibleArrivalDate ? new Date(this.s.possibleArrivalDate) : null],
    productCost: [this.s?.productCost ?? null],
    shippingCost: [this.s?.shippingCost ?? null],
    commissionCost: [this.s?.commissionCost ?? null],
    domesticJapanShippingCost: [this.s?.domesticJapanShippingCost ?? null],
    additionalCost: [this.s?.additionalCost ?? null],
    totalSoles: [this.s?.totalSoles ?? null],
    totalDollars: [this.s?.totalDollars ?? null],
    handlingCost: [this.s?.handlingCost ?? null],
    finalCost: [this.s?.finalCost ?? null],
    figuresWeight: [this.s?.figuresWeight ?? null],
    finalWeight: [this.s?.finalWeight ?? null],
    notes: [this.s?.notes ?? ''],
  });

  ngOnInit(): void {
    this.shipmentHolderService.findAll().subscribe((res) => this.holders.set(res.data));
    this.shipmentRecipientService.findAll().subscribe((res) => this.recipients.set(res.data));

    // "Días de viaje" nunca se escribe a mano: se calcula solo a partir de fecha de
    // salida/llegada, mismo criterio que transitDays/weightDifference en el backend.
    this.form.controls.travelDays.disable({ emitEvent: false });
    this.form.controls.departureDate.valueChanges.subscribe(() => this.recalculateTravelDays());
    this.form.controls.arrivalDate.valueChanges.subscribe(() => this.recalculateTravelDays());
    this.recalculateTravelDays();

    this.items().forEach((item, index) => {
      if (item.id && item.imageUrl) this.loadItemImage(index, item.id);
    });
  }

  ngOnDestroy(): void {
    for (const item of this.items()) {
      if (item.imageObjectUrl) URL.revokeObjectURL(item.imageObjectUrl);
    }
  }

  private recalculateTravelDays(): void {
    const departure = this.form.controls.departureDate.value;
    const arrival = this.form.controls.arrivalDate.value;
    if (!departure || !arrival) {
      this.form.controls.travelDays.setValue(null, { emitEvent: false });
      return;
    }
    const d = typeof departure === 'string' ? new Date(departure) : departure;
    const a = typeof arrival === 'string' ? new Date(arrival) : arrival;
    const days = Math.round((a.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    this.form.controls.travelDays.setValue(days, { emitEvent: false });
  }

  updateItem(index: number, patch: Partial<ShipmentItemDraft>): void {
    this.items.update((items) => items.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  addItem(): void {
    this.items.update((items) => [...items, emptyItem()]);
  }

  removeItem(index: number): void {
    const item = this.items()[index];
    if (item?.imageObjectUrl) URL.revokeObjectURL(item.imageObjectUrl);
    this.items.update((items) => items.filter((_, i) => i !== index));
  }

  viewItemImage(index: number): void {
    const item = this.items()[index];
    if (!item?.imageObjectUrl) return;
    this.dialog.open(ImagePreviewDialogComponent, {
      data: { imageUrl: item.imageObjectUrl, title: item.description || 'Foto del artículo' },
      width: '500px',
      maxWidth: '90vw',
      autoFocus: false,
    });
  }

  private loadItemImage(index: number, itemId: number): void {
    this.shipmentService.getItemImageBlob(itemId).subscribe({
      next: (blob) => this.updateItem(index, { imageObjectUrl: URL.createObjectURL(blob) }),
      error: () => {},
    });
  }

  onImageSelected(index: number, event: Event): void {
    const item = this.items()[index];
    const file = (event.target as HTMLInputElement).files?.[0];
    (event.target as HTMLInputElement).value = '';
    if (!file || !item?.id) return;

    if (file.size > 5 * 1024 * 1024) {
      this.snackBar.open('La imagen no debe superar 5MB', 'Cerrar', { duration: 3000 });
      return;
    }

    this.updateItem(index, { uploadingImage: true });
    this.shipmentService.uploadItemImage(item.id, file).subscribe({
      next: () => {
        if (item.imageObjectUrl) URL.revokeObjectURL(item.imageObjectUrl);
        this.updateItem(index, { uploadingImage: false, imageObjectUrl: URL.createObjectURL(file), imageUrl: 'set' });
      },
      error: () => this.updateItem(index, { uploadingImage: false }),
    });
  }

  removeItemImage(index: number): void {
    const item = this.items()[index];
    if (!item?.id) return;
    this.updateItem(index, { uploadingImage: true });
    this.shipmentService.deleteItemImage(item.id).subscribe({
      next: () => {
        if (item.imageObjectUrl) URL.revokeObjectURL(item.imageObjectUrl);
        this.updateItem(index, { uploadingImage: false, imageObjectUrl: null, imageUrl: null });
      },
      error: () => this.updateItem(index, { uploadingImage: false }),
    });
  }

  save(): void {
    const validItems = this.items().filter((it) => it.description.trim() && it.quantity > 0);
    if (this.form.invalid || validItems.length === 0) {
      this.form.markAllAsTouched();
      this.snackBar.open('Completa los campos obligatorios y al menos un artículo con descripción', 'Cerrar', { duration: 4000 });
      return;
    }

    const v = this.form.getRawValue();
    const request: ShipmentRequest = {
      code: v.code!.trim(),
      holderId: v.holderId!,
      recipientId: v.recipientId!,
      zenOrderNumber: v.zenOrderNumber || null,
      productCost: v.productCost,
      shippingCost: v.shippingCost,
      commissionCost: v.commissionCost,
      domesticJapanShippingCost: v.domesticJapanShippingCost,
      additionalCost: v.additionalCost,
      totalSoles: v.totalSoles,
      totalDollars: v.totalDollars,
      handlingCost: v.handlingCost,
      finalCost: v.finalCost,
      shipmentType: v.shipmentType!,
      departureDate: this.toIsoDate(v.departureDate),
      arrivalDate: this.toIsoDate(v.arrivalDate),
      travelDays: v.travelDays,
      possibleArrivalDate: this.toIsoDate(v.possibleArrivalDate),
      figuresWeight: v.figuresWeight,
      finalWeight: v.finalWeight,
      status: v.status!,
      notes: v.notes || null,
      items: validItems.map((it) => ({
        id: it.id,
        articleCode: it.articleCode.trim() || null,
        description: it.description.trim(),
        quantity: Number(it.quantity),
      })),
    };

    this.saving.set(true);
    const obs = this.s ? this.shipmentService.update(this.s.id, request) : this.shipmentService.create(request);
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

  private toIsoDate(date: Date | string | null | undefined): string | null {
    if (!date) return null;
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

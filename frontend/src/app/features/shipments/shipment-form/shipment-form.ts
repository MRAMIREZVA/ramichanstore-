import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
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
  SHIPMENT_DOCUMENT_TYPE_LABELS,
  SHIPMENT_STATUS_LABELS,
  Shipment,
  ShipmentDocumentType,
  ShipmentHolder,
  ShipmentRecipient,
  ShipmentRequest,
  ShipmentStatus,
  ShipmentTypeOption,
} from '../../../core/models/shipment.model';
import { SettingService } from '../../../core/services/setting.service';
import { ShipmentHolderService } from '../../../core/services/shipment-holder.service';
import { ShipmentRecipientService } from '../../../core/services/shipment-recipient.service';
import { ShipmentService } from '../../../core/services/shipment.service';
import { ShipmentTypeOptionService } from '../../../core/services/shipment-type-option.service';
import { parseIsoDate } from '../../../core/utils/date';
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

/** Invoice/Factura son documentos generales de la compra; DIF/DIF_VOUCHER solo aplican si el embarque pasó por aduanas. */
const DOCUMENT_TYPES: ShipmentDocumentType[] = ['INVOICE', 'FACTURA', 'DIF', 'DIF_VOUCHER'];

interface DocumentSlot {
  fileName: string | null;
  objectUrl: string | null;
  uploading: boolean;
}

function emptyDocumentSlot(): DocumentSlot {
  return { fileName: null, objectUrl: null, uploading: false };
}

@Component({
  selector: 'app-shipment-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
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
  private readonly shipmentTypeOptionService = inject(ShipmentTypeOptionService);
  private readonly settingService = inject(SettingService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<ShipmentFormComponent>);
  private readonly dialog = inject(MatDialog);
  readonly data = inject<ShipmentFormData>(MAT_DIALOG_DATA);

  readonly statusOptions = Object.entries(SHIPMENT_STATUS_LABELS) as [ShipmentStatus, string][];

  readonly saving = signal(false);
  readonly holders = signal<ShipmentHolder[]>([]);
  readonly recipients = signal<ShipmentRecipient[]>([]);
  readonly types = signal<ShipmentTypeOption[]>([]);
  /** SHIPMENT_ADDITIONAL_COST_PERCENT (Configuración) — un solo valor general, ver CLAUDE.md Fase 31. */
  readonly additionalCostPercent = signal<number | null>(null);
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

  readonly documentTypes = DOCUMENT_TYPES;
  readonly documentLabels = SHIPMENT_DOCUMENT_TYPE_LABELS;
  readonly documents = signal<Record<ShipmentDocumentType, DocumentSlot>>(this.buildInitialDocuments());

  readonly form = this.fb.group({
    code: [this.s?.code ?? '', [Validators.required, Validators.maxLength(50)]],
    holderId: [this.s?.holderId ?? null, Validators.required],
    recipientId: [this.s?.recipientId ?? null, Validators.required],
    zenOrderNumber: [this.s?.zenOrderNumber ?? ''],
    shipmentTypeId: [this.s?.shipmentTypeId ?? null, Validators.required],
    status: [this.s?.status ?? ('PENDIENTE_ENVIO' as ShipmentStatus), Validators.required],
    departureDate: [parseIsoDate(this.s?.departureDate)],
    arrivalDate: [parseIsoDate(this.s?.arrivalDate)],
    travelDays: [this.s?.travelDays ?? null],
    possibleArrivalDate: [parseIsoDate(this.s?.possibleArrivalDate)],
    productCost: [this.s?.productCost ?? null],
    shippingCost: [this.s?.shippingCost ?? null],
    commissionCost: [this.s?.commissionCost ?? null],
    domesticJapanShippingCost: [this.s?.domesticJapanShippingCost ?? null],
    additionalCost: [this.s?.additionalCost ?? null],
    handlingCost: [this.s?.handlingCost ?? null],
    customsCharge: [this.s?.customsCharge ?? null],
    exchangeRate: [this.s?.exchangeRate ?? null],
    totalDollars: [this.s?.totalDollars ?? null],
    totalSoles: [this.s?.totalSoles ?? null],
    finalCost: [this.s?.finalCost ?? null],
    figuresWeight: [this.s?.figuresWeight ?? null],
    finalWeight: [this.s?.finalWeight ?? null],
    notes: [this.s?.notes ?? ''],
    wentThroughCustoms: [this.s?.wentThroughCustoms ?? false],
    customsTaxAmount: [this.s?.customsTaxAmount ?? null],
  });

  ngOnInit(): void {
    this.shipmentHolderService.findAll().subscribe((res) => this.holders.set(res.data));
    this.shipmentRecipientService.findAll().subscribe((res) => this.recipients.set(res.data));
    this.shipmentTypeOptionService.findAll().subscribe((res) => this.types.set(res.data));
    this.settingService.findAll().subscribe({
      next: (res) => {
        const setting = res.data.find((s) => s.key === 'SHIPMENT_ADDITIONAL_COST_PERCENT');
        this.additionalCostPercent.set(setting ? Number(setting.value) : null);
        this.recalculateTotals();
      },
      error: () => {},
    });

    // "Días de viaje" nunca se escribe a mano: se calcula solo a partir de fecha de
    // salida/llegada, mismo criterio que transitDays/weightDifference en el backend.
    this.form.controls.travelDays.disable({ emitEvent: false });
    this.form.controls.departureDate.valueChanges.subscribe(() => this.recalculateTravelDays());
    this.form.controls.arrivalDate.valueChanges.subscribe(() => this.recalculateTravelDays());
    this.recalculateTravelDays();

    // Costo adicional/Total (US$)/Total (S/)/Costo final tampoco se escriben a mano — se
    // calculan igual que en el backend (ShipmentResponse), mismo criterio que travelDays.
    // Costo adicional = Total (S/) × SHIPMENT_ADDITIONAL_COST_PERCENT (un % general, ver arriba).
    this.form.controls.additionalCost.disable({ emitEvent: false });
    this.form.controls.totalDollars.disable({ emitEvent: false });
    this.form.controls.totalSoles.disable({ emitEvent: false });
    this.form.controls.finalCost.disable({ emitEvent: false });
    for (const key of ['productCost', 'shippingCost', 'commissionCost', 'domesticJapanShippingCost',
      'handlingCost', 'customsCharge', 'exchangeRate'] as const) {
      this.form.controls[key].valueChanges.subscribe(() => this.recalculateTotals());
    }
    this.recalculateTotals();

    this.items().forEach((item, index) => {
      if (item.id && item.imageUrl) this.loadItemImage(index, item.id);
    });

    if (this.s) {
      for (const type of this.documentTypes) {
        const doc = this.s.documents.find((d) => d.documentType === type);
        if (doc) this.loadDocument(type, doc.fileName);
      }
    }
  }

  ngOnDestroy(): void {
    for (const item of this.items()) {
      if (item.imageObjectUrl) URL.revokeObjectURL(item.imageObjectUrl);
    }
    for (const slot of Object.values(this.documents())) {
      if (slot.objectUrl) URL.revokeObjectURL(slot.objectUrl);
    }
  }

  private buildInitialDocuments(): Record<ShipmentDocumentType, DocumentSlot> {
    return {
      INVOICE: emptyDocumentSlot(),
      DIF: emptyDocumentSlot(),
      DIF_VOUCHER: emptyDocumentSlot(),
      FACTURA: emptyDocumentSlot(),
    };
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

  /**
   * Todos los costos (producto/envío/comisión/envío Japón/adicional/gastos
   * movibles) van en S/ — el tipo de cambio solo convierte Total (S/) a su
   * equivalente informativo en US$, nunca al revés. Costo final suma todo en
   * soles, sin conversión. Mismo cálculo que ShipmentResponse en el backend
   * (ver CLAUDE.md, Fase 22). Costo adicional = Total (S/) × porcentaje
   * general (Fase 31) — ya no se tipea por embarque.
   */
  private recalculateTotals(): void {
    const v = this.form.getRawValue();
    const solesFields = [v.productCost, v.shippingCost, v.commissionCost, v.domesticJapanShippingCost];
    const hasAnySolesValue = solesFields.some((n) => n !== null && n !== undefined);
    const totalSoles = hasAnySolesValue ? solesFields.reduce((sum: number, n) => sum + (Number(n) || 0), 0) : null;
    this.form.controls.totalSoles.setValue(totalSoles, { emitEvent: false });

    const rate = v.exchangeRate;
    const totalDollars = totalSoles !== null && rate ? totalSoles / Number(rate) : null;
    this.form.controls.totalDollars.setValue(totalDollars !== null ? Math.round(totalDollars * 100) / 100 : null, { emitEvent: false });

    const percent = this.additionalCostPercent();
    const additionalCost = totalSoles !== null && percent !== null ? Math.round(totalSoles * percent) / 100 : null;
    this.form.controls.additionalCost.setValue(additionalCost, { emitEvent: false });

    const finalCost = totalSoles !== null
      ? totalSoles + (additionalCost ?? 0) + (Number(v.handlingCost) || 0) + (Number(v.customsCharge) || 0)
      : null;
    this.form.controls.finalCost.setValue(finalCost, { emitEvent: false });
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

  private updateDocument(type: ShipmentDocumentType, patch: Partial<DocumentSlot>): void {
    this.documents.update((docs) => ({ ...docs, [type]: { ...docs[type], ...patch } }));
  }

  private loadDocument(type: ShipmentDocumentType, fileName: string): void {
    this.updateDocument(type, { fileName });
    this.shipmentService.getDocumentBlob(this.s!.id, type).subscribe({
      next: (blob) => this.updateDocument(type, { objectUrl: URL.createObjectURL(blob) }),
      error: () => {},
    });
  }

  onDocumentSelected(type: ShipmentDocumentType, event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    (event.target as HTMLInputElement).value = '';
    if (!file || !this.s) return;

    if (file.size > 10 * 1024 * 1024) {
      this.snackBar.open('El documento no debe superar 10MB', 'Cerrar', { duration: 3000 });
      return;
    }

    this.updateDocument(type, { uploading: true });
    this.shipmentService.uploadDocument(this.s.id, type, file).subscribe({
      next: () => {
        const prev = this.documents()[type];
        if (prev.objectUrl) URL.revokeObjectURL(prev.objectUrl);
        this.updateDocument(type, { uploading: false, fileName: file.name, objectUrl: URL.createObjectURL(file) });
      },
      error: () => this.updateDocument(type, { uploading: false }),
    });
  }

  removeDocument(type: ShipmentDocumentType): void {
    if (!this.s) return;
    this.updateDocument(type, { uploading: true });
    this.shipmentService.deleteDocument(this.s.id, type).subscribe({
      next: () => {
        const prev = this.documents()[type];
        if (prev.objectUrl) URL.revokeObjectURL(prev.objectUrl);
        this.updateDocument(type, { uploading: false, fileName: null, objectUrl: null });
      },
      error: () => this.updateDocument(type, { uploading: false }),
    });
  }

  viewDocument(type: ShipmentDocumentType): void {
    const slot = this.documents()[type];
    if (slot.objectUrl) window.open(slot.objectUrl, '_blank');
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
      handlingCost: v.handlingCost,
      customsCharge: v.customsCharge,
      exchangeRate: v.exchangeRate,
      shipmentTypeId: v.shipmentTypeId!,
      departureDate: this.toIsoDate(v.departureDate),
      arrivalDate: this.toIsoDate(v.arrivalDate),
      travelDays: v.travelDays,
      possibleArrivalDate: this.toIsoDate(v.possibleArrivalDate),
      figuresWeight: v.figuresWeight,
      finalWeight: v.finalWeight,
      status: v.status!,
      notes: v.notes || null,
      wentThroughCustoms: v.wentThroughCustoms ?? false,
      customsTaxAmount: v.customsTaxAmount,
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

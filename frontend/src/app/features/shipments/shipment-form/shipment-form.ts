import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
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

export interface ShipmentFormData {
  shipment: Shipment | null;
}

interface ShipmentItemDraft {
  articleCode: string;
  description: string;
  quantity: number;
}

function emptyItem(): ShipmentItemDraft {
  return { articleCode: '', description: '', quantity: 1 };
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
  ],
  templateUrl: './shipment-form.html',
  styleUrl: './shipment-form.scss',
})
export class ShipmentFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly shipmentService = inject(ShipmentService);
  private readonly shipmentHolderService = inject(ShipmentHolderService);
  private readonly shipmentRecipientService = inject(ShipmentRecipientService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<ShipmentFormComponent>);
  readonly data = inject<ShipmentFormData>(MAT_DIALOG_DATA);

  readonly typeOptions = Object.entries(SHIPMENT_TYPE_LABELS) as [ShipmentType, string][];
  readonly statusOptions = Object.entries(SHIPMENT_STATUS_LABELS) as [ShipmentStatus, string][];

  readonly saving = signal(false);
  readonly holders = signal<ShipmentHolder[]>([]);
  readonly recipients = signal<ShipmentRecipient[]>([]);
  readonly items = signal<ShipmentItemDraft[]>(
    this.data.shipment?.items.map((i) => ({ articleCode: i.articleCode ?? '', description: i.description, quantity: i.quantity })) ?? [
      emptyItem(),
    ],
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
    this.items.update((items) => items.filter((_, i) => i !== index));
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

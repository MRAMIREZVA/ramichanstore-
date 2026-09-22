import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { Customer } from '../../../core/models/customer.model';
import { DELIVERY_STATUS_LABELS, Delivery, DeliveryRequest, DeliveryStatus, PendingPurchase } from '../../../core/models/delivery.model';
import { DELIVERY_METHOD_LABELS, DeliveryMethod } from '../../../core/models/sale.model';
import { CustomerService } from '../../../core/services/customer.service';
import { DeliveryService } from '../../../core/services/delivery.service';
import { parseIsoDate } from '../../../core/utils/date';

export interface DeliveryFormData {
  delivery: Delivery | null;
}

/**
 * Desde Fase 17 una entrega es por CLIENTE, no por venta: se elige un
 * cliente y se marca qué compras suyas (ventas y/o separaciones) pendientes
 * de entregar se agrupan en esta entrega — ver CLAUDE.md.
 */
@Component({
  selector: 'app-delivery-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatCheckboxModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './delivery-form.html',
  styleUrl: './delivery-form.scss',
})
export class DeliveryFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly customerService = inject(CustomerService);
  private readonly deliveryService = inject(DeliveryService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<DeliveryFormComponent>);
  readonly data = inject<DeliveryFormData>(MAT_DIALOG_DATA);

  readonly deliveryTypeOptions = Object.entries(DELIVERY_METHOD_LABELS) as [DeliveryMethod, string][];
  readonly statusOptions = Object.entries(DELIVERY_STATUS_LABELS) as [DeliveryStatus, string][];

  readonly saving = signal(false);
  readonly searchingCustomer = signal(false);
  readonly customerOptions = signal<Customer[]>([]);
  readonly selectedCustomerId = signal<number | null>(this.data.delivery?.customerId ?? null);

  readonly loadingPurchases = signal(false);
  readonly pendingPurchases = signal<PendingPurchase[]>([]);
  readonly selectedSaleIds = signal<Set<number>>(new Set());
  readonly selectedSeparationIds = signal<Set<number>>(new Set());

  readonly form = this.fb.group({
    customerSearch: [
      this.data.delivery ? `${this.data.delivery.customerName} — ${this.data.delivery.customerPhone ?? ''}` : '',
      Validators.required,
    ],
    deliveryType: [this.data.delivery?.deliveryType ?? ('DELIVERY' as DeliveryMethod), Validators.required],
    address: [this.data.delivery?.address ?? ''],
    district: [this.data.delivery?.district ?? ''],
    agency: [this.data.delivery?.agency ?? ''],
    courier: [this.data.delivery?.courier ?? ''],
    scheduledDate: [this.data.delivery ? parseIsoDate(this.data.delivery.scheduledDate) : new Date(), Validators.required],
    status: [this.data.delivery?.status ?? ('PENDING' as DeliveryStatus), Validators.required],
    notes: [this.data.delivery?.notes ?? ''],
  });

  constructor() {
    this.form.controls.customerSearch.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          if (!term || (this.selectedCustomerId() && term === this.form.controls.customerSearch.value)) {
            return [];
          }
          this.searchingCustomer.set(true);
          return this.customerService.search({ search: term, page: 0, size: 10 });
        }),
      )
      .subscribe({
        next: (res) => {
          this.customerOptions.set(res.data.content);
          this.searchingCustomer.set(false);
        },
        error: () => this.searchingCustomer.set(false),
      });
  }

  ngOnInit(): void {
    const delivery = this.data.delivery;
    if (delivery) {
      this.form.controls.customerSearch.disable();
      this.selectedSaleIds.set(
        new Set(delivery.items.filter((i) => i.type === 'VENTA' && i.saleId != null).map((i) => i.saleId!)),
      );
      this.selectedSeparationIds.set(
        new Set(delivery.items.filter((i) => i.type === 'SEPARACION' && i.separationId != null).map((i) => i.separationId!)),
      );
      this.loadPendingPurchases(delivery.customerId, delivery.id);
    }
  }

  customerLabel(customer: Customer | string | null): string {
    return customer && typeof customer === 'object' ? `${customer.fullName} — ${customer.phone}` : (customer ?? '');
  }

  onCustomerSelected(customer: Customer): void {
    this.selectedCustomerId.set(customer.id);
    this.form.controls.customerSearch.setValue(this.customerLabel(customer), { emitEvent: false });
    this.customerOptions.set([]);
    this.selectedSaleIds.set(new Set());
    this.selectedSeparationIds.set(new Set());
    this.loadPendingPurchases(customer.id, null);
  }

  private loadPendingPurchases(customerId: number, excludeDeliveryId: number | null): void {
    this.loadingPurchases.set(true);
    this.deliveryService.getPendingPurchases(customerId, excludeDeliveryId).subscribe({
      next: (res) => {
        this.pendingPurchases.set(res.data);
        this.loadingPurchases.set(false);
      },
      error: () => this.loadingPurchases.set(false),
    });
  }

  isSelected(purchase: PendingPurchase): boolean {
    return purchase.type === 'VENTA' ? this.selectedSaleIds().has(purchase.id) : this.selectedSeparationIds().has(purchase.id);
  }

  toggle(purchase: PendingPurchase): void {
    const target = purchase.type === 'VENTA' ? this.selectedSaleIds : this.selectedSeparationIds;
    const next = new Set(target());
    if (next.has(purchase.id)) {
      next.delete(purchase.id);
    } else {
      next.add(purchase.id);
    }
    target.set(next);
  }

  get hasSelection(): boolean {
    return this.selectedSaleIds().size > 0 || this.selectedSeparationIds().size > 0;
  }

  save(): void {
    const customerId = this.selectedCustomerId();
    if (!customerId || this.form.invalid || !this.hasSelection) {
      this.form.markAllAsTouched();
      if (customerId && !this.hasSelection) {
        this.snackBar.open('Selecciona al menos una compra para incluir en la entrega', 'Cerrar', { duration: 3000 });
      }
      return;
    }

    const v = this.form.getRawValue();
    const request: DeliveryRequest = {
      customerId,
      saleIds: [...this.selectedSaleIds()],
      separationIds: [...this.selectedSeparationIds()],
      deliveryType: v.deliveryType as DeliveryMethod,
      address: v.address || null,
      district: v.district || null,
      agency: v.agency || null,
      courier: v.courier || null,
      scheduledDate: this.toIsoDate(v.scheduledDate as Date),
      status: v.status as DeliveryStatus,
      notes: v.notes || null,
    };

    this.saving.set(true);
    const request$ = this.data.delivery
      ? this.deliveryService.update(this.data.delivery.id, request)
      : this.deliveryService.create(request);

    request$.subscribe({
      next: (response) => {
        this.saving.set(false);
        this.snackBar.open(response.message, 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: () => this.saving.set(false),
    });
  }

  close(): void {
    this.dialogRef.close(false);
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

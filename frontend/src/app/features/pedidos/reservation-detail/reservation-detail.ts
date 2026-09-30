import { SlicePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  PREORDER_STATUS_LABELS,
  PreorderReservation,
  PreorderReservationPayment,
} from '../../../core/models/preorder.model';
import { PAYMENT_METHOD_LABELS, PaymentMethod } from '../../../core/models/sale.model';
import { PreorderService } from '../../../core/services/preorder.service';
import { parseIsoDate, toIsoDate } from '../../../core/utils/date';
import { resolveImageUrl } from '../../../core/utils/image-url';
import { BuyerCardComponent } from '../../../shared/components/buyer-card/buyer-card';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog';

export interface ReservationDetailData {
  reservation: PreorderReservation;
}

@Component({
  selector: 'app-reservation-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SlicePipe,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    BuyerCardComponent,
  ],
  templateUrl: './reservation-detail.html',
  styleUrl: './reservation-detail.scss',
})
export class ReservationDetailComponent {
  private readonly fb = inject(FormBuilder);
  private readonly preorderService = inject(PreorderService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly dialogRef = inject(MatDialogRef<ReservationDetailComponent>);
  readonly data = inject<ReservationDetailData>(MAT_DIALOG_DATA);

  readonly statusLabels = PREORDER_STATUS_LABELS;
  readonly resolveImageUrl = resolveImageUrl;
  readonly methodOptions = Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][];
  readonly displayedColumns = ['date', 'amount', 'method', 'user', 'actions'];

  readonly reservation = signal(this.data.reservation);
  readonly payments = signal<PreorderReservationPayment[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly changed = signal(false);

  readonly form = this.fb.group({
    amount: [0, [Validators.required, Validators.min(0.01)]],
    paymentMethod: ['EFECTIVO' as PaymentMethod, Validators.required],
    paymentDate: [new Date(), Validators.required],
    notes: [''],
  });

  /** Corrige el precio unitario de la reserva — algunos clientes tienen precio de preventa/descuento vs. catálogo. */
  readonly editingPrice = signal(false);
  readonly priceDraft = signal(0);
  readonly savingPrice = signal(false);

  /** Corrige el día en que se hizo la reserva — pensado para backfill de preventas anteriores al sistema. */
  readonly editingDate = signal(false);
  readonly dateDraftControl = new FormControl<Date | null>(null);
  readonly savingDate = signal(false);

  /** Editar un abono ya registrado reutiliza el mismo formulario de "Registrar abono". */
  readonly editingPaymentId = signal<number | null>(null);

  constructor() {
    this.loadPayments();
  }

  startEditPrice(): void {
    this.priceDraft.set(this.reservation().unitPrice);
    this.editingPrice.set(true);
  }

  cancelEditPrice(): void {
    this.editingPrice.set(false);
  }

  savePrice(): void {
    const unitPrice = Number(this.priceDraft());
    if (Number.isNaN(unitPrice) || unitPrice < 0) return;
    this.savingPrice.set(true);
    this.preorderService.updateReservationPrice(this.reservation().id, { unitPrice }).subscribe({
      next: (res) => {
        this.savingPrice.set(false);
        this.editingPrice.set(false);
        this.changed.set(true);
        this.reservation.set(res.data);
        this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
      },
      error: () => this.savingPrice.set(false),
    });
  }

  startEditDate(): void {
    this.dateDraftControl.setValue(parseIsoDate(this.reservation().createdAt.slice(0, 10)));
    this.editingDate.set(true);
  }

  cancelEditDate(): void {
    this.editingDate.set(false);
  }

  saveDate(): void {
    const iso = toIsoDate(this.dateDraftControl.value);
    if (!iso) return;
    this.savingDate.set(true);
    this.preorderService.updateReservationDate(this.reservation().id, iso).subscribe({
      next: (res) => {
        this.savingDate.set(false);
        this.editingDate.set(false);
        this.changed.set(true);
        this.reservation.set(res.data);
        this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
      },
      error: () => this.savingDate.set(false),
    });
  }

  /** Recalcula amountPaid/balanceDue desde la lista recién cargada — misma fuente de verdad para crear/editar/eliminar. */
  loadPayments(): void {
    this.loading.set(true);
    this.preorderService.listPayments(this.reservation().id).subscribe({
      next: (res) => {
        this.payments.set(res.data);
        this.loading.set(false);
        const amountPaid = res.data.reduce((sum, p) => sum + p.amount, 0);
        this.reservation.update((r) => ({ ...r, amountPaid, balanceDue: r.totalPrice - amountPaid }));
      },
      error: () => this.loading.set(false),
    });
  }

  submitPayment(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const date = v.paymentDate as Date;
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const request = {
      amount: Number(v.amount),
      paymentMethod: v.paymentMethod as PaymentMethod,
      paymentDate: iso,
      notes: v.notes || null,
    };

    const editingId = this.editingPaymentId();
    const obs = editingId
      ? this.preorderService.updatePayment(this.reservation().id, editingId, request)
      : this.preorderService.registerPayment(this.reservation().id, request);

    this.saving.set(true);
    obs.subscribe({
      next: (res) => {
        this.saving.set(false);
        this.changed.set(true);
        this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
        this.cancelEditPayment();
        this.loadPayments();
      },
      error: () => this.saving.set(false),
    });
  }

  startEditPayment(payment: PreorderReservationPayment): void {
    this.editingPaymentId.set(payment.id);
    this.form.setValue({
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      paymentDate: parseIsoDate(payment.paymentDate) ?? new Date(),
      notes: payment.notes ?? '',
    });
  }

  cancelEditPayment(): void {
    this.editingPaymentId.set(null);
    this.form.reset({ amount: 0, paymentMethod: 'EFECTIVO', paymentDate: new Date(), notes: '' });
  }

  deletePayment(payment: PreorderReservationPayment): void {
    const data: ConfirmDialogData = {
      title: 'Eliminar abono',
      message: `¿Eliminar el abono de S/ ${payment.amount.toFixed(2)} del ${payment.paymentDate}?`,
      confirmLabel: 'Eliminar',
      destructive: true,
    };
    const ref = this.dialog.open(ConfirmDialog, { data, width: '420px' });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.preorderService.deletePayment(this.reservation().id, payment.id).subscribe({
        next: (res) => {
          this.changed.set(true);
          this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
          if (this.editingPaymentId() === payment.id) this.cancelEditPayment();
          this.loadPayments();
        },
      });
    });
  }

  close(): void {
    this.dialogRef.close(this.changed());
  }
}

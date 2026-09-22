import { SlicePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
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
import { MatTableModule } from '@angular/material/table';
import {
  PREORDER_STATUS_LABELS,
  PreorderReservation,
  PreorderReservationPayment,
} from '../../../core/models/preorder.model';
import { PAYMENT_METHOD_LABELS, PaymentMethod } from '../../../core/models/sale.model';
import { PreorderService } from '../../../core/services/preorder.service';
import { resolveImageUrl } from '../../../core/utils/image-url';
import { BuyerCardComponent } from '../../../shared/components/buyer-card/buyer-card';

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
    BuyerCardComponent,
  ],
  templateUrl: './reservation-detail.html',
  styleUrl: './reservation-detail.scss',
})
export class ReservationDetailComponent {
  private readonly fb = inject(FormBuilder);
  private readonly preorderService = inject(PreorderService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<ReservationDetailComponent>);
  readonly data = inject<ReservationDetailData>(MAT_DIALOG_DATA);

  readonly statusLabels = PREORDER_STATUS_LABELS;
  readonly resolveImageUrl = resolveImageUrl;
  readonly methodOptions = Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][];
  readonly displayedColumns = ['date', 'amount', 'method', 'user'];

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

  constructor() {
    this.loadPayments();
  }

  loadPayments(): void {
    this.loading.set(true);
    this.preorderService.listPayments(this.reservation().id).subscribe({
      next: (res) => {
        this.payments.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  registerPayment(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const date = v.paymentDate as Date;
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    this.saving.set(true);
    this.preorderService
      .registerPayment(this.reservation().id, {
        amount: Number(v.amount),
        paymentMethod: v.paymentMethod as PaymentMethod,
        paymentDate: iso,
        notes: v.notes || null,
      })
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          this.changed.set(true);
          this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
          this.form.reset({ amount: 0, paymentMethod: 'EFECTIVO', paymentDate: new Date(), notes: '' });
          this.reservation.update((r) => ({
            ...r,
            amountPaid: r.amountPaid + Number(v.amount),
            balanceDue: r.balanceDue - Number(v.amount),
          }));
          this.loadPayments();
        },
        error: () => this.saving.set(false),
      });
  }

  close(): void {
    this.dialogRef.close(this.changed());
  }
}

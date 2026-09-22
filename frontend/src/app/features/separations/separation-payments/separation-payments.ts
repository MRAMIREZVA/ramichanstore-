import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
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
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, PaymentMethod } from '../../../core/models/sale.model';
import { Separation, SeparationPayment } from '../../../core/models/separation.model';
import { SeparationService } from '../../../core/services/separation.service';
import { parseIsoDate } from '../../../core/utils/date';
import { BuyerCardComponent } from '../../../shared/components/buyer-card/buyer-card';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { CancelSeparationDialogComponent, CancelSeparationDialogData } from '../cancel-separation-dialog/cancel-separation-dialog';

export interface SeparationPaymentsData {
  separation: Separation;
}

@Component({
  selector: 'app-separation-payments',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
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
  templateUrl: './separation-payments.html',
  styleUrl: './separation-payments.scss',
})
export class SeparationPaymentsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly separationService = inject(SeparationService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly dialogRef = inject(MatDialogRef<SeparationPaymentsComponent>);
  readonly data = inject<SeparationPaymentsData>(MAT_DIALOG_DATA);

  readonly separation = signal(this.data.separation);
  readonly payments = signal<SeparationPayment[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly changed = signal(false);

  readonly methodOptions = Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][];
  readonly statusLabels = PAYMENT_STATUS_LABELS;
  readonly displayedColumns = ['date', 'amount', 'method', 'user', 'actions'];

  /** Abono que se está corrigiendo (reutiliza el mismo formulario de arriba) — null si se está registrando uno nuevo. */
  readonly editingPaymentId = signal<number | null>(null);

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
    this.separationService.listPayments(this.separation().id).subscribe({
      next: (res) => {
        this.payments.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private refreshSeparation(): void {
    this.separationService.findById(this.separation().id).subscribe((res) => this.separation.set(res.data));
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
      ? this.separationService.updatePayment(this.separation().id, editingId, request)
      : this.separationService.registerPayment(this.separation().id, request);

    this.saving.set(true);
    obs.subscribe({
      next: (res) => {
        this.saving.set(false);
        this.changed.set(true);
        this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
        this.cancelEdit();
        this.loadPayments();
        this.refreshSeparation();
      },
      error: () => this.saving.set(false),
    });
  }

  startEdit(payment: SeparationPayment): void {
    this.editingPaymentId.set(payment.id);
    this.form.setValue({
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      paymentDate: parseIsoDate(payment.paymentDate) ?? new Date(),
      notes: payment.notes ?? '',
    });
  }

  cancelEdit(): void {
    this.editingPaymentId.set(null);
    this.form.reset({ amount: 0, paymentMethod: 'EFECTIVO', paymentDate: new Date(), notes: '' });
  }

  deletePayment(payment: SeparationPayment): void {
    const data: ConfirmDialogData = {
      title: 'Eliminar abono',
      message: `¿Eliminar el abono de S/ ${payment.amount.toFixed(2)} del ${payment.paymentDate}? El estado de la separación se recalculará.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    };
    const ref = this.dialog.open(ConfirmDialog, { data, width: '420px' });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.separationService.deletePayment(this.separation().id, payment.id).subscribe({
        next: (res) => {
          this.changed.set(true);
          this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
          if (this.editingPaymentId() === payment.id) this.cancelEdit();
          this.loadPayments();
          this.refreshSeparation();
        },
      });
    });
  }

  cancelSeparation(): void {
    const data: CancelSeparationDialogData = { separation: this.separation() };
    const ref = this.dialog.open<CancelSeparationDialogComponent, CancelSeparationDialogData, string | null>(
      CancelSeparationDialogComponent,
      { data, width: '480px' },
    );
    ref.afterClosed().subscribe((reason) => {
      if (!reason) return;
      this.separationService.cancel(this.separation().id, reason).subscribe({
        next: (res) => {
          this.changed.set(true);
          this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
          this.refreshSeparation();
        },
      });
    });
  }

  close(): void {
    this.dialogRef.close(this.changed());
  }
}

import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrderRequest } from '../../../core/models/order-request.model';
import { OrderRequestService } from '../../../core/services/order-request.service';

export interface ConvertToReservationsDialogData {
  orderRequest: OrderRequest;
}

/**
 * A diferencia de "Convertir a venta" (un clic, sin pedir nada más), acá el
 * admin tiene que declarar el depósito REAL que ya coordinó con el cliente
 * por cada ítem — una reserva de preventa siempre exige un depósito de
 * verdad, nunca se puede inventar uno solo por automatizar la conversión
 * (ver OrderRequestService.convertToReservations, backend). Prellenado con
 * `suggestedDeposit` (mínimo × cantidad) como punto de partida editable.
 */
@Component({
  selector: 'app-convert-to-reservations-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './convert-to-reservations-dialog.html',
  styleUrl: './convert-to-reservations-dialog.scss',
})
export class ConvertToReservationsDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly orderRequestService = inject(OrderRequestService);
  private readonly dialogRef = inject(MatDialogRef<ConvertToReservationsDialogComponent>);
  readonly data = inject<ConvertToReservationsDialogData>(MAT_DIALOG_DATA);

  readonly saving = signal(false);

  readonly form = this.fb.group({
    deposits: this.fb.array(
      this.data.orderRequest.items.map((item) =>
        this.fb.group({
          itemId: [item.id],
          depositAmount: [item.suggestedDeposit ?? 0, [Validators.required, Validators.min(0)]],
        }),
      ),
    ),
  });

  get depositControls() {
    return this.form.controls.deposits.controls;
  }

  confirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const deposits = this.form.getRawValue().deposits!.map((d) => ({
      itemId: d.itemId!,
      depositAmount: Number(d.depositAmount),
    }));
    this.saving.set(true);
    this.orderRequestService.convertToReservations(this.data.orderRequest.id, deposits).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.dialogRef.close(res.message);
      },
      error: () => this.saving.set(false),
    });
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}

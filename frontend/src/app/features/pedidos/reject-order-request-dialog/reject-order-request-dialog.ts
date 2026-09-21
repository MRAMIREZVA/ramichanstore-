import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { OrderRequest } from '../../../core/models/order-request.model';

export interface RejectOrderRequestDialogData {
  orderRequest: OrderRequest;
}

/** Pide un motivo obligatorio antes de rechazar un pedido web. */
@Component({
  selector: 'app-reject-order-request-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './reject-order-request-dialog.html',
  styleUrl: './reject-order-request-dialog.scss',
})
export class RejectOrderRequestDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<RejectOrderRequestDialogComponent>);
  readonly data = inject<RejectOrderRequestDialogData>(MAT_DIALOG_DATA);
  readonly saving = signal(false);

  readonly form = this.fb.group({
    reason: ['', [Validators.required, Validators.maxLength(500)]],
  });

  confirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.getRawValue().reason);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}

import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Sale } from '../../../core/models/sale.model';

export interface CancelSaleDialogData {
  sale: Sale;
}

/** Pide un motivo obligatorio antes de cancelar una venta (revierte stock). */
@Component({
  selector: 'app-cancel-sale-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './cancel-sale-dialog.html',
  styleUrl: './cancel-sale-dialog.scss',
})
export class CancelSaleDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CancelSaleDialogComponent>);
  readonly data = inject<CancelSaleDialogData>(MAT_DIALOG_DATA);
  readonly saving = signal(false);

  readonly form = this.fb.group({
    reason: ['', [Validators.required, Validators.maxLength(255)]],
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

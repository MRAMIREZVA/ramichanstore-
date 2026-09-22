import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ShipmentRecipient, ShipmentRecipientRequest } from '../../../core/models/shipment.model';

export interface ShipmentRecipientFormData {
  recipient: ShipmentRecipient | null;
}

@Component({
  selector: 'app-shipment-recipient-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './shipment-recipient-form.html',
  styleUrl: './shipment-recipient-form.scss',
})
export class ShipmentRecipientFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ShipmentRecipientFormComponent>);
  readonly data = inject<ShipmentRecipientFormData>(MAT_DIALOG_DATA);

  readonly form = this.fb.group({
    name: [this.data.recipient?.name ?? '', [Validators.required, Validators.maxLength(150)]],
    notes: [this.data.recipient?.notes ?? '', Validators.maxLength(255)],
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const request: ShipmentRecipientRequest = { name: v.name!, notes: v.notes || null };
    this.dialogRef.close(request);
  }

  close(): void {
    this.dialogRef.close(null);
  }
}

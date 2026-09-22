import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ShipmentHolder, ShipmentHolderRequest } from '../../../core/models/shipment.model';

export interface ShipmentHolderFormData {
  holder: ShipmentHolder | null;
}

@Component({
  selector: 'app-shipment-holder-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './shipment-holder-form.html',
  styleUrl: './shipment-holder-form.scss',
})
export class ShipmentHolderFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ShipmentHolderFormComponent>);
  readonly data = inject<ShipmentHolderFormData>(MAT_DIALOG_DATA);

  readonly form = this.fb.group({
    name: [this.data.holder?.name ?? '', [Validators.required, Validators.maxLength(150)]],
    notes: [this.data.holder?.notes ?? '', Validators.maxLength(255)],
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const request: ShipmentHolderRequest = {
      name: v.name!,
      notes: v.notes || null,
    };
    this.dialogRef.close(request);
  }

  close(): void {
    this.dialogRef.close(null);
  }
}

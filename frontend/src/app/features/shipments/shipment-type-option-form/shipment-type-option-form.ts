import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ShipmentTypeOption, ShipmentTypeOptionRequest } from '../../../core/models/shipment.model';

export interface ShipmentTypeOptionFormData {
  option: ShipmentTypeOption | null;
}

@Component({
  selector: 'app-shipment-type-option-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './shipment-type-option-form.html',
  styleUrl: './shipment-type-option-form.scss',
})
export class ShipmentTypeOptionFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ShipmentTypeOptionFormComponent>);
  readonly data = inject<ShipmentTypeOptionFormData>(MAT_DIALOG_DATA);

  readonly form = this.fb.group({
    name: [this.data.option?.name ?? '', [Validators.required, Validators.maxLength(100)]],
    notes: [this.data.option?.notes ?? '', Validators.maxLength(255)],
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const request: ShipmentTypeOptionRequest = {
      name: v.name!,
      notes: v.notes || null,
    };
    this.dialogRef.close(request);
  }

  close(): void {
    this.dialogRef.close(null);
  }
}

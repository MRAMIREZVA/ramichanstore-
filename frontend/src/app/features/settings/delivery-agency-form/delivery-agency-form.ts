import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DeliveryAgency, DeliveryAgencyRequest } from '../../../core/models/delivery-agency.model';

export interface DeliveryAgencyFormData {
  agency: DeliveryAgency | null;
}

/** Diálogo de alta/edición de una agencia de envío (Shalom, Olva, etc.) — solo nombre. */
@Component({
  selector: 'app-delivery-agency-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './delivery-agency-form.html',
  styleUrl: './delivery-agency-form.scss',
})
export class DeliveryAgencyFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<DeliveryAgencyFormComponent>);
  readonly data = inject<DeliveryAgencyFormData>(MAT_DIALOG_DATA);

  readonly form = this.fb.group({
    name: [this.data.agency?.name ?? '', [Validators.required, Validators.maxLength(100)]],
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const request: DeliveryAgencyRequest = { name: this.form.getRawValue().name! };
    this.dialogRef.close(request);
  }

  close(): void {
    this.dialogRef.close(null);
  }
}

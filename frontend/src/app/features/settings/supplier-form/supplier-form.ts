import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Supplier, SupplierRequest } from '../../../core/models/catalog.model';

export interface SupplierFormData {
  supplier: Supplier | null;
}

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './supplier-form.html',
  styleUrl: './supplier-form.scss',
})
export class SupplierFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<SupplierFormComponent>);
  readonly data = inject<SupplierFormData>(MAT_DIALOG_DATA);

  readonly form = this.fb.group({
    name: [this.data.supplier?.name ?? '', [Validators.required, Validators.maxLength(150)]],
    company: [this.data.supplier?.company ?? '', Validators.maxLength(150)],
    phone: [this.data.supplier?.phone ?? '', Validators.maxLength(30)],
    whatsapp: [this.data.supplier?.whatsapp ?? '', Validators.maxLength(30)],
    email: [this.data.supplier?.email ?? '', Validators.maxLength(150)],
    country: [this.data.supplier?.country ?? '', Validators.maxLength(80)],
    address: [this.data.supplier?.address ?? '', Validators.maxLength(255)],
    notes: [this.data.supplier?.notes ?? '', Validators.maxLength(500)],
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const request: SupplierRequest = {
      name: v.name!,
      company: v.company || null,
      phone: v.phone || null,
      whatsapp: v.whatsapp || null,
      email: v.email || null,
      country: v.country || null,
      address: v.address || null,
      notes: v.notes || null,
    };
    this.dialogRef.close(request);
  }

  close(): void {
    this.dialogRef.close(null);
  }
}

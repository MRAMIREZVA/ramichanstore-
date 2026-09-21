import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  CUSTOMER_STATUS_LABELS,
  Customer,
  CustomerRequest,
  CustomerStatus,
  DOCUMENT_TYPE_LABELS,
  DocumentType,
} from '../../../core/models/customer.model';
import { CustomerService } from '../../../core/services/customer.service';

export interface CustomerFormData {
  customer: Customer | null;
}

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './customer-form.html',
  styleUrl: './customer-form.scss',
})
export class CustomerFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly customerService = inject(CustomerService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<CustomerFormComponent>);
  readonly data = inject<CustomerFormData>(MAT_DIALOG_DATA);

  readonly saving = signal(false);
  readonly documentTypeOptions = Object.entries(DOCUMENT_TYPE_LABELS) as [DocumentType, string][];
  readonly statusOptions = Object.entries(CUSTOMER_STATUS_LABELS) as [CustomerStatus, string][];

  readonly form = this.fb.group({
    fullName: [this.data.customer?.fullName ?? '', [Validators.required, Validators.maxLength(200)]],
    documentType: [this.data.customer?.documentType ?? null],
    documentNumber: [this.data.customer?.documentNumber ?? '', Validators.maxLength(20)],
    phone: [this.data.customer?.phone ?? '', [Validators.required, Validators.maxLength(30)]],
    whatsapp: [this.data.customer?.whatsapp ?? '', Validators.maxLength(30)],
    email: [this.data.customer?.email ?? '', [Validators.email, Validators.maxLength(150)]],
    district: [this.data.customer?.district ?? '', Validators.maxLength(100)],
    address: [this.data.customer?.address ?? '', Validators.maxLength(255)],
    status: [this.data.customer?.status ?? 'ACTIVE', Validators.required],
    notes: [this.data.customer?.notes ?? '', Validators.maxLength(500)],
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const request: CustomerRequest = {
      fullName: v.fullName!,
      documentType: (v.documentType as DocumentType) || null,
      documentNumber: v.documentNumber || null,
      phone: v.phone!,
      whatsapp: v.whatsapp || null,
      email: v.email || null,
      district: v.district || null,
      address: v.address || null,
      status: v.status as CustomerStatus,
      notes: v.notes || null,
    };

    this.saving.set(true);
    const request$ = this.data.customer
      ? this.customerService.update(this.data.customer.id, request)
      : this.customerService.create(request);

    request$.subscribe({
      next: (response) => {
        this.saving.set(false);
        this.snackBar.open(response.message, 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: () => this.saving.set(false),
    });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}

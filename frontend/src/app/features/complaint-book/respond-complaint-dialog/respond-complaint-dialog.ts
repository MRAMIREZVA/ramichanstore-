import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Complaint, ComplaintStatus, COMPLAINT_STATUS_LABELS, RespondComplaintRequest } from '../../../core/models/complaint.model';

export interface RespondComplaintDialogData {
  complaint: Complaint;
}

/** "Acciones adoptadas por el proveedor" — la respuesta que la ley exige registrar frente a un reclamo/queja. */
@Component({
  selector: 'app-respond-complaint-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './respond-complaint-dialog.html',
  styleUrl: './respond-complaint-dialog.scss',
})
export class RespondComplaintDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<RespondComplaintDialogComponent>);
  readonly data = inject<RespondComplaintDialogData>(MAT_DIALOG_DATA);
  readonly saving = signal(false);

  readonly statusOptions = (Object.entries(COMPLAINT_STATUS_LABELS) as [ComplaintStatus, string][]).filter(
    ([status]) => status !== 'PENDIENTE',
  );

  readonly form = this.fb.group({
    status: [(this.data.complaint.status === 'PENDIENTE' ? 'EN_PROCESO' : this.data.complaint.status) as ComplaintStatus, Validators.required],
    providerResponse: [this.data.complaint.providerResponse ?? '', Validators.required],
  });

  confirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const request: RespondComplaintRequest = { status: v.status as ComplaintStatus, providerResponse: v.providerResponse! };
    this.dialogRef.close(request);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}

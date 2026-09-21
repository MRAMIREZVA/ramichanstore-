import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppUser } from '../../../core/models/user-admin.model';
import { UserAdminService } from '../../../core/services/user-admin.service';

export interface ResetPasswordDialogData {
  user: AppUser;
}

@Component({
  selector: 'app-reset-password-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './reset-password-dialog.html',
  styleUrl: './reset-password-dialog.scss',
})
export class ResetPasswordDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly userAdminService = inject(UserAdminService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<ResetPasswordDialogComponent>);
  readonly data = inject<ResetPasswordDialogData>(MAT_DIALOG_DATA);
  readonly saving = signal(false);

  readonly form = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  confirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.userAdminService.resetPassword(this.data.user.id, this.form.getRawValue().newPassword!).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: () => this.saving.set(false),
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}

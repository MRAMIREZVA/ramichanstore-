import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppUser, Role, UserCreateRequest, UserUpdateRequest } from '../../../core/models/user-admin.model';
import { UserAdminService } from '../../../core/services/user-admin.service';

export interface UserFormData {
  user: AppUser | null;
  roles: Role[];
}

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './user-form.html',
  styleUrl: './user-form.scss',
})
export class UserFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly userAdminService = inject(UserAdminService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<UserFormComponent>);
  readonly data = inject<UserFormData>(MAT_DIALOG_DATA);

  readonly saving = signal(false);

  readonly form = this.fb.group({
    username: [this.data.user?.username ?? '', [Validators.required, Validators.maxLength(50)]],
    email: [this.data.user?.email ?? '', [Validators.required, Validators.email, Validators.maxLength(150)]],
    fullName: [this.data.user?.fullName ?? '', [Validators.required, Validators.maxLength(150)]],
    password: ['', this.data.user ? [] : [Validators.required, Validators.minLength(8)]],
    roleId: [this.data.user?.roleId ?? this.data.roles[0]?.id ?? null, Validators.required],
    active: [this.data.user?.active ?? true],
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);

    if (this.data.user) {
      const request: UserUpdateRequest = {
        username: v.username!,
        email: v.email!,
        fullName: v.fullName!,
        roleId: v.roleId!,
        active: v.active!,
      };
      this.userAdminService.updateUser(this.data.user.id, request).subscribe({
        next: (res) => this.onSuccess(res.message),
        error: () => this.saving.set(false),
      });
    } else {
      const request: UserCreateRequest = {
        username: v.username!,
        email: v.email!,
        fullName: v.fullName!,
        password: v.password!,
        roleId: v.roleId!,
        active: v.active!,
      };
      this.userAdminService.createUser(request).subscribe({
        next: (res) => this.onSuccess(res.message),
        error: () => this.saving.set(false),
      });
    }
  }

  private onSuccess(message: string): void {
    this.saving.set(false);
    this.snackBar.open(message, 'Cerrar', { duration: 3000 });
    this.dialogRef.close(true);
  }

  close(): void {
    this.dialogRef.close(false);
  }
}

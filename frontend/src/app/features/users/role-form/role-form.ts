import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Permission, Role, RoleRequest } from '../../../core/models/user-admin.model';
import { UserAdminService } from '../../../core/services/user-admin.service';

export interface RoleFormData {
  role: Role | null;
  permissions: Permission[];
}

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './role-form.html',
  styleUrl: './role-form.scss',
})
export class RoleFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly userAdminService = inject(UserAdminService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<RoleFormComponent>);
  readonly data = inject<RoleFormData>(MAT_DIALOG_DATA);

  readonly isAdminRole = this.data.role?.name === 'ADMIN';
  readonly saving = signal(false);
  readonly selectedIds = signal<Set<number>>(new Set(this.data.role?.permissions.map((p) => p.id) ?? []));

  readonly form = this.fb.group({
    name: [this.data.role?.name ?? '', [Validators.required, Validators.maxLength(50)]],
    description: [this.data.role?.description ?? '', Validators.maxLength(255)],
  });

  readonly modules = computed(() => {
    const groups = new Map<string, Permission[]>();
    for (const p of this.data.permissions) {
      if (!groups.has(p.module)) groups.set(p.module, []);
      groups.get(p.module)!.push(p);
    }
    return Array.from(groups.entries()).map(([module, permissions]) => ({ module, permissions }));
  });

  isChecked(permissionId: number): boolean {
    return this.selectedIds().has(permissionId);
  }

  toggle(permissionId: number): void {
    this.selectedIds.update((set) => {
      const next = new Set(set);
      if (next.has(permissionId)) next.delete(permissionId);
      else next.add(permissionId);
      return next;
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const request: RoleRequest = {
      name: v.name!,
      description: v.description || null,
      permissionIds: Array.from(this.selectedIds()),
    };

    this.saving.set(true);
    const request$ = this.data.role
      ? this.userAdminService.updateRole(this.data.role.id, request)
      : this.userAdminService.createRole(request);

    request$.subscribe({
      next: (res) => {
        this.saving.set(false);
        this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: () => this.saving.set(false),
    });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}

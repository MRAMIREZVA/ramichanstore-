import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/services/auth.service';
import { AppUser, Permission, Role } from '../../../core/models/user-admin.model';
import { UserAdminService } from '../../../core/services/user-admin.service';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { ResetPasswordDialogComponent, ResetPasswordDialogData } from '../reset-password-dialog/reset-password-dialog';
import { RoleFormComponent, RoleFormData } from '../role-form/role-form';
import { UserFormComponent, UserFormData } from '../user-form/user-form';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-users-admin',
  standalone: true,
  imports: [
    DatePipe,
    MatTabsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './users-admin.html',
  styleUrl: './users-admin.scss',
})
export class UsersAdmin implements OnInit {
  private readonly userAdminService = inject(UserAdminService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly currentUserId = this.authService.currentUser()?.id ?? null;

  readonly loadingUsers = signal(true);
  readonly users = signal<AppUser[]>([]);
  readonly userColumns = ['username', 'fullName', 'email', 'role', 'status', 'lastLogin', 'actions'];

  readonly loadingRoles = signal(true);
  readonly roles = signal<Role[]>([]);
  readonly permissions = signal<Permission[]>([]);
  readonly roleColumns = ['name', 'description', 'permissions', 'actions'];

  ngOnInit(): void {
    this.loadRoles();
    this.loadUsers();
    this.loadPermissions();
  }

  loadUsers(): void {
    this.loadingUsers.set(true);
    this.userAdminService.findAllUsers().subscribe({
      next: (res) => {
        this.users.set(res.data);
        this.loadingUsers.set(false);
      },
      error: () => this.loadingUsers.set(false),
    });
  }

  loadRoles(): void {
    this.loadingRoles.set(true);
    this.userAdminService.findAllRoles().subscribe({
      next: (res) => {
        this.roles.set(res.data);
        this.loadingRoles.set(false);
      },
      error: () => this.loadingRoles.set(false),
    });
  }

  loadPermissions(): void {
    this.userAdminService.findAllPermissions().subscribe((res) => this.permissions.set(res.data));
  }

  openCreateUser(): void {
    this.openUserForm(null);
  }

  openEditUser(user: AppUser): void {
    this.openUserForm(user);
  }

  private openUserForm(user: AppUser | null): void {
    const data: UserFormData = { user, roles: this.roles() };
    const ref = this.dialog.open<UserFormComponent, UserFormData, boolean>(UserFormComponent, {
      data,
      width: '620px',
      maxWidth: '95vw',
      autoFocus: false,
    });
    ref.afterClosed().subscribe((changed) => {
      if (changed) this.loadUsers();
    });
  }

  openResetPassword(user: AppUser): void {
    const data: ResetPasswordDialogData = { user };
    this.dialog.open(ResetPasswordDialogComponent, { data, width: '420px' });
  }

  confirmDeleteUser(user: AppUser): void {
    const data: ConfirmDialogData = {
      title: 'Eliminar usuario',
      message: `¿Seguro que deseas eliminar a "${user.username}"?`,
      confirmLabel: 'Eliminar',
      destructive: true,
    };
    const ref = this.dialog.open(ConfirmDialog, { data, width: '420px' });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.userAdminService.deleteUser(user.id).subscribe({
        next: (res) => {
          this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
          this.loadUsers();
        },
      });
    });
  }

  openCreateRole(): void {
    this.openRoleForm(null);
  }

  openEditRole(role: Role): void {
    this.openRoleForm(role);
  }

  private openRoleForm(role: Role | null): void {
    const data: RoleFormData = { role, permissions: this.permissions() };
    const ref = this.dialog.open<RoleFormComponent, RoleFormData, boolean>(RoleFormComponent, {
      data,
      width: '760px',
      maxWidth: '95vw',
      autoFocus: false,
    });
    ref.afterClosed().subscribe((changed) => {
      if (changed) this.loadRoles();
    });
  }

  confirmDeleteRole(role: Role): void {
    const data: ConfirmDialogData = {
      title: 'Eliminar rol',
      message: `¿Seguro que deseas eliminar el rol "${role.name}"? Solo es posible si no tiene usuarios asignados.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    };
    const ref = this.dialog.open(ConfirmDialog, { data, width: '420px' });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.userAdminService.deleteRole(role.id).subscribe({
        next: (res) => {
          this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
          this.loadRoles();
        },
      });
    });
  }
}

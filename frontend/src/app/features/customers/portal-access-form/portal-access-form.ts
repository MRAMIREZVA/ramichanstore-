import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Customer } from '../../../core/models/customer.model';
import { CustomerService } from '../../../core/services/customer.service';
import { whatsAppLink } from '../../../core/utils/whatsapp';

export interface PortalAccessFormData {
  customer: Customer;
  /** true = restablecer contraseña de un acceso ya habilitado; false = habilitar (usuario + contraseña) por primera vez o de nuevo. */
  resetOnly: boolean;
}

@Component({
  selector: 'app-portal-access-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
  ],
  templateUrl: './portal-access-form.html',
  styleUrl: './portal-access-form.scss',
})
export class PortalAccessFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly customerService = inject(CustomerService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<PortalAccessFormComponent>);
  readonly data = inject<PortalAccessFormData>(MAT_DIALOG_DATA);

  readonly saving = signal(false);
  /** Credenciales recién guardadas — solo viven en memoria para armar el aviso; nunca se vuelven a poder leer del backend (hash). */
  readonly savedCredentials = signal<{ username: string; password: string } | null>(null);

  readonly form = this.fb.group({
    username: [
      this.data.resetOnly ? { value: this.data.customer.portalUsername ?? '', disabled: true } : (this.data.customer.portalUsername ?? ''),
      [Validators.required, Validators.maxLength(50)],
    ],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);

    if (this.data.resetOnly) {
      this.customerService.resetPortalPassword(this.data.customer.id, v.password!).subscribe({
        next: (res) => this.onSuccess(res.message, v.username!, v.password!),
        error: () => this.saving.set(false),
      });
    } else {
      this.customerService.enablePortalAccess(this.data.customer.id, v.username!, v.password!).subscribe({
        next: (res) => this.onSuccess(res.message, v.username!, v.password!),
        error: () => this.saving.set(false),
      });
    }
  }

  private onSuccess(message: string, username: string, password: string): void {
    this.saving.set(false);
    this.savedCredentials.set({ username, password });
    this.snackBar.open(message, 'Cerrar', { duration: 3000 });
  }

  get whatsAppShareUrl(): string | null {
    const creds = this.savedCredentials();
    if (!creds) return null;
    const rawPhone = this.data.customer.whatsapp || this.data.customer.phone;
    if (!rawPhone) return null;
    const message =
      `Hola ${this.data.customer.fullName}, ya puedes ingresar a tu cuenta en RamichanStore ` +
      `para ver tus compras y preventas:\n\n` +
      `${location.origin}/portal/login\n\n` +
      `Usuario: ${creds.username}\n` +
      `Contraseña: ${creds.password}`;
    return whatsAppLink(rawPhone, message);
  }

  get hasWhatsAppNumber(): boolean {
    return !!(this.data.customer.whatsapp || this.data.customer.phone);
  }

  copyPassword(): void {
    const creds = this.savedCredentials();
    if (!creds) return;
    navigator.clipboard?.writeText(creds.password).then(() => {
      this.snackBar.open('Contraseña copiada', 'Cerrar', { duration: 2000 });
    });
  }

  finish(): void {
    this.dialogRef.close(true);
  }

  close(): void {
    this.dialogRef.close(!!this.savedCredentials());
  }
}

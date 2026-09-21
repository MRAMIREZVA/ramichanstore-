import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PortalAuthService } from '../../../core/services/portal-auth.service';
import { PublicCatalogService } from '../../../core/services/public-catalog.service';
import { whatsAppLink } from '../../../core/utils/whatsapp';

@Component({
  selector: 'app-portal-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './portal-login.html',
  styleUrl: './portal-login.scss',
})
export class PortalLogin implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly portalAuthService = inject(PortalAuthService);
  private readonly catalogService = inject(PublicCatalogService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly hidePassword = signal(true);
  /** null hasta que responde /api/catalog/store-info, o si el admin no configuró STORE_WHATSAPP. */
  readonly supportWhatsAppUrl = signal<string | null>(null);

  ngOnInit(): void {
    this.catalogService.getStoreInfo().subscribe({
      next: (res) => {
        if (!res.data.whatsapp) return;
        const message = `Hola, necesito ayuda con mi acceso al portal de clientes de ${res.data.storeName}.`;
        this.supportWhatsAppUrl.set(whatsAppLink(res.data.whatsapp, message));
      },
      error: () => {},
    });
  }

  readonly form = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { username, password } = this.form.getRawValue();

    this.portalAuthService.login({ username: username!, password: password! }).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/portal';
        this.router.navigateByUrl(returnUrl);
      },
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false),
    });
  }
}

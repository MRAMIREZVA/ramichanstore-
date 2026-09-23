import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PortalAuthService } from '../../../core/services/portal-auth.service';

@Component({
  selector: 'app-portal-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './portal-layout.html',
  styleUrl: './portal-layout.scss',
})
export class PortalLayout implements OnInit, OnDestroy {
  private readonly portalAuthService = inject(PortalAuthService);
  readonly customer = this.portalAuthService.currentCustomer;

  ngOnInit(): void {
    // Mismo motivo que CatalogLayout: un mat-dialog/mat-select abierto desde
    // acá se renderiza fuera de .portal-shell (en el cdk-overlay-container,
    // que cuelga de <body>) — ver styles.scss, Fase 29.
    document.body.classList.add('portal-scope');
  }

  ngOnDestroy(): void {
    document.body.classList.remove('portal-scope');
  }

  logout(): void {
    this.portalAuthService.logout();
  }
}

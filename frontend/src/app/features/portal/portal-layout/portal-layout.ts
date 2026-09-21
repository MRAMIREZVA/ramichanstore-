import { Component, inject } from '@angular/core';
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
export class PortalLayout {
  private readonly portalAuthService = inject(PortalAuthService);
  readonly customer = this.portalAuthService.currentCustomer;

  logout(): void {
    this.portalAuthService.logout();
  }
}

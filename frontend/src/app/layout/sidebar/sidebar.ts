import { Component, EventEmitter, Input, Output, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NAV_ITEMS } from '../../core/constants/nav-items';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatButtonModule, MatIconModule, MatListModule, MatTooltipModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  private readonly authService = inject(AuthService);

  // Un rol sin ninguno de los permisos de un módulo ni siquiera lo ve en el menú (Fase 75)
  // — antes el sidebar mostraba los 14 módulos a cualquier rol, aunque entrar a la mitad
  // terminara en puros 403 (ver el hallazgo de VENDEDOR en la Fase 70). `computed()` (no
  // un array plano) porque `hasPermission` lee el signal `currentUser` por debajo — si el
  // rol gana/pierde permisos tras un refresh silencioso (Fase 75), el menú se recalcula
  // solo, sin esperar a un logout/login manual.
  readonly navItems = computed(() =>
    NAV_ITEMS.filter((item) => item.permissions.some((code) => this.authService.hasPermission(code))),
  );

  /** Botón de cerrar visible solo cuando el sidebar vive dentro del drawer móvil (Fase 58) —
   *  en escritorio el sidenav es `mode="side"` fijo, cerrarlo no tendría sentido. */
  @Input() isMobile = false;
  @Output() closeRequested = new EventEmitter<void>();
}

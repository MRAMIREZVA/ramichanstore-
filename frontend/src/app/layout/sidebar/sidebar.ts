import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NAV_ITEMS } from '../../core/constants/nav-items';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatButtonModule, MatIconModule, MatListModule, MatTooltipModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  readonly navItems = NAV_ITEMS;

  /** Botón de cerrar visible solo cuando el sidebar vive dentro del drawer móvil (Fase 58) —
   *  en escritorio el sidenav es `mode="side"` fijo, cerrarlo no tendría sentido. */
  @Input() isMobile = false;
  @Output() closeRequested = new EventEmitter<void>();
}

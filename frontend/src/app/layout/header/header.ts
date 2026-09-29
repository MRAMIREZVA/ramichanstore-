import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatToolbarModule, MatIconModule, MatButtonModule, MatMenuModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly authService = inject(AuthService);

  readonly currentUser = this.authService.currentUser;

  /** En escritorio el sidebar siempre está visible y trae su propia marca — el header no
   *  necesita mostrar nada a la izquierda. En móvil el sidebar arranca cerrado, así que el
   *  header gana el botón de menú + el nombre de la tienda para no quedar vacío (Fase 58). */
  @Input() isMobile = false;
  @Output() menuToggle = new EventEmitter<void>();

  logout(): void {
    this.authService.logout();
  }
}

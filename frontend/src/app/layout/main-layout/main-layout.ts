import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Header } from '../header/header';
import { Sidebar } from '../sidebar/sidebar';

/**
 * El panel admin nació pensado 100% para escritorio (Fase 21: "el admin sigue de escritorio a
 * propósito, se usa desde una laptop"). El dueño reportó después que sí lo abre desde el celular
 * (captura real: el sidebar de 260px, siempre abierto y sin forma de cerrarlo, se comía casi
 * toda la pantalla y no dejaba ver las tablas de Pedidos) — Fase 58, ajuste explícito pedido
 * para "todos los ambientes". Mismo patrón ya usado en el catálogo público (`isMobileFilters`
 * en catalog-home.ts, Fase 45): por debajo de 768px (mismo corte que ya usaba
 * `.shell-main` en main-layout.scss) el sidenav pasa de `mode="side"` (fijo, siempre visible)
 * a `mode="over"` (drawer que se abre con un botón y se cierra solo).
 *
 * Alcance deliberado: esto arregla el SIDEBAR, que era el bloqueador real (sin él no se podía
 * ver casi nada). Las tablas de datos de cada pantalla admin siguen siendo densas en un
 * teléfono — eso es un trabajo aparte, pantalla por pantalla, no incluido acá.
 */
@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, MatSidenavModule, Header, Sidebar],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly router = inject(Router);

  readonly isMobile = toSignal(this.breakpointObserver.observe('(max-width: 768px)').pipe(map((r) => r.matches)), {
    initialValue: false,
  });

  readonly sidebarOpen = signal(false);

  constructor() {
    // Cerrar el drawer solo al navegar — si no, después de tocar "Productos" el propio menú
    // se queda tapando la pantalla nueva en vez de dejar ver el listado al que se acaba de entrar.
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      if (this.isMobile()) this.sidebarOpen.set(false);
    });
  }
}

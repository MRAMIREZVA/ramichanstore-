import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { PreordersList } from '../../preorders/preorders-list/preorders-list';
import { SalesList } from '../../sales/sales-list/sales-list';
import { SeparationsList } from '../../separations/separations-list/separations-list';
import { OrderRequestsList } from '../order-requests-list/order-requests-list';
import { ReservationsList } from '../reservations-list/reservations-list';

/**
 * "Pedidos" — unifica Ventas, Pagos y Separaciones, y Preventas en un solo
 * ítem de menú (a pedido explícito del dueño: "tengo muchas opciones"). Cada
 * pestaña reutiliza el componente ya existente tal cual — el modelo de datos
 * y las reglas de negocio de Sale/Separation/Preorder NO cambiaron, solo la
 * capa de menú/pantallas (ver CLAUDE.md sección 9, decisión explícita del dueño
 * de mantener las campañas de preventa gestionadas aparte de las reservas).
 *
 * `?tab=N` abre directamente esa pestaña (usado por "Ver todas" en la ficha
 * del cliente); `customerId`/`customerName` los leen las pestañas Ventas y
 * Separaciones por su cuenta para autofiltrarse (ver SalesList/SeparationsList).
 */
@Component({
  selector: 'app-pedidos-page',
  standalone: true,
  imports: [MatTabsModule, SalesList, SeparationsList, ReservationsList, PreordersList, OrderRequestsList],
  templateUrl: './pedidos-page.html',
  styleUrl: './pedidos-page.scss',
})
export class PedidosPage {
  private readonly route = inject(ActivatedRoute);

  readonly initialTab = Number(this.route.snapshot.queryParamMap.get('tab') ?? 0);
}

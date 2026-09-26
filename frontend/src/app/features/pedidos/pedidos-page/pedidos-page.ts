import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { PreordersList } from '../../preorders/preorders-list/preorders-list';
import { SalesList } from '../../sales/sales-list/sales-list';
import { OrderRequestsList } from '../order-requests-list/order-requests-list';
import { ReservationsList } from '../reservations-list/reservations-list';

/**
 * "Pedidos" — unifica Ventas/Separaciones (fusionadas en una sola entidad Sale, discriminada
 * por `type`, ver sale.model.ts) y Preventas en un solo ítem de menú. La pestaña "Ventas" ahora
 * incluye ambos tipos de compra (filtrables por Tipo dentro de la propia lista) — antes existía
 * una pestaña "Separaciones" aparte, retirada al fusionar los datos (ver CLAUDE.md).
 *
 * `?tab=N` abre directamente esa pestaña (usado por "Ver todas" en la ficha del cliente):
 * 0=Ventas, 1=Preventas, 2=Campañas de preventa, 3=Pedidos web.
 */
@Component({
  selector: 'app-pedidos-page',
  standalone: true,
  imports: [MatTabsModule, SalesList, ReservationsList, PreordersList, OrderRequestsList],
  templateUrl: './pedidos-page.html',
  styleUrl: './pedidos-page.scss',
})
export class PedidosPage {
  private readonly route = inject(ActivatedRoute);

  readonly initialTab = Number(this.route.snapshot.queryParamMap.get('tab') ?? 0);
}

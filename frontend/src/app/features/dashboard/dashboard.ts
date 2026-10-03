import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DashboardSummary } from '../../core/models/report.model';
import { ReportService } from '../../core/services/report.service';

interface StatCard {
  label: string;
  icon: string;
  value: () => string;
  warn?: () => boolean;
}

/**
 * Alertas operativas (Fase 82): a diferencia de los StatCard de arriba (números del día/mes),
 * estas son acciones pendientes — cada una navega a la pantalla real donde se resuelve. `count`
 * queda en 0 tanto si no hay nada pendiente como si tu rol no tiene permiso para ver ese módulo
 * (ver ReportService.hasAuthority en el backend) — el frontend no distingue ambos casos a
 * propósito, nunca muestra la fila en ninguno de los dos.
 */
interface OperationalAlert {
  icon: string;
  message: () => string;
  count: () => number;
  routerLink: string;
  queryParams?: Record<string, number | boolean>;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatIconModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly authService = inject(AuthService);
  private readonly reportService = inject(ReportService);

  readonly currentUser = this.authService.currentUser;
  readonly loading = signal(true);
  readonly summary = signal<DashboardSummary | null>(null);
  // Antes, un 403 por falta de PERM_DASHBOARD_VIEW (ej. un rol como VENDEDOR, Fase 70)
  // caía en el `?? 0` de cada tarjeta y mostraba "S/ 0.00" en todo — indistinguible de un
  // día real sin ventas. Ahora se avisa explícitamente en vez de mentir con un cero (Fase 75).
  readonly accessDenied = signal(false);

  readonly stats: StatCard[] = [
    { label: 'Ventas del día', icon: 'today', value: () => `S/ ${(this.summary()?.salesTodayTotal ?? 0).toFixed(2)}` },
    { label: 'Ventas del mes', icon: 'calendar_month', value: () => `S/ ${(this.summary()?.salesMonthTotal ?? 0).toFixed(2)}` },
    { label: 'Ganancia del mes', icon: 'trending_up', value: () => `S/ ${(this.summary()?.profitMonth ?? 0).toFixed(2)}` },
    { label: 'Productos registrados', icon: 'inventory_2', value: () => `${this.summary()?.productsRegistered ?? 0}` },
    {
      label: 'Stock bajo',
      icon: 'warning',
      value: () => `${this.summary()?.lowStockCount ?? 0}`,
      warn: () => (this.summary()?.lowStockCount ?? 0) > 0,
    },
    { label: 'Preventas activas', icon: 'schedule', value: () => `${this.summary()?.activePreorders ?? 0}` },
    { label: 'Clientes registrados', icon: 'groups', value: () => `${this.summary()?.registeredCustomers ?? 0}` },
    {
      label: 'Pagos pendientes',
      icon: 'payments',
      value: () => `${this.summary()?.pendingPaymentsCount ?? 0} (S/ ${(this.summary()?.pendingPaymentsBalance ?? 0).toFixed(2)})`,
      warn: () => (this.summary()?.pendingPaymentsCount ?? 0) > 0,
    },
  ];

  readonly alerts: OperationalAlert[] = [
    {
      icon: 'local_shipping',
      message: () => `${this.summary()?.lateDeliveries ?? 0} entrega${(this.summary()?.lateDeliveries ?? 0) === 1 ? '' : 's'} atrasada${(this.summary()?.lateDeliveries ?? 0) === 1 ? '' : 's'}`,
      count: () => this.summary()?.lateDeliveries ?? 0,
      routerLink: '/entregas',
    },
    {
      icon: 'event_busy',
      message: () => `${this.summary()?.overduePreorders ?? 0} campaña${(this.summary()?.overduePreorders ?? 0) === 1 ? '' : 's'} de preventa con fecha límite vencida`,
      count: () => this.summary()?.overduePreorders ?? 0,
      routerLink: '/pedidos',
      queryParams: { tab: 2 },
    },
    {
      icon: 'shopping_cart',
      message: () => `${this.summary()?.pendingWebOrders ?? 0} pedido${(this.summary()?.pendingWebOrders ?? 0) === 1 ? '' : 's'} web sin atender`,
      count: () => this.summary()?.pendingWebOrders ?? 0,
      routerLink: '/pedidos',
      queryParams: { tab: 3 },
    },
    {
      icon: 'fact_check',
      message: () => `${this.summary()?.customsFlaggedShipments ?? 0} embarque${(this.summary()?.customsFlaggedShipments ?? 0) === 1 ? '' : 's'} observado${(this.summary()?.customsFlaggedShipments ?? 0) === 1 ? '' : 's'} por aduanas`,
      count: () => this.summary()?.customsFlaggedShipments ?? 0,
      routerLink: '/embarques',
    },
    {
      // Fase 84: el dato ya se calculaba (misma tarjeta "Pagos pendientes" de arriba) y el
      // filtro ya existía (pendingBalance, Fase 79) — solo faltaba conectar los dos, igual
      // patrón que las otras 4 alertas.
      icon: 'payments',
      message: () =>
        `${this.summary()?.pendingPaymentsCount ?? 0} venta${(this.summary()?.pendingPaymentsCount ?? 0) === 1 ? '' : 's'} con saldo pendiente — S/ ${(this.summary()?.pendingPaymentsBalance ?? 0).toFixed(2)}`,
      count: () => this.summary()?.pendingPaymentsCount ?? 0,
      routerLink: '/pedidos',
      queryParams: { tab: 0, pendingBalance: true },
    },
  ];

  readonly visibleAlerts = computed(() => this.alerts.filter((a) => a.count() > 0));

  constructor() {
    this.reportService.getDashboard().subscribe({
      next: (res) => {
        this.summary.set(res.data);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        if (err instanceof HttpErrorResponse && err.status === 403) {
          this.accessDenied.set(true);
        }
      },
    });
  }
}

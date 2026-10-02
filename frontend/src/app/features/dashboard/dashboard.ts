import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { DashboardSummary } from '../../core/models/report.model';
import { ReportService } from '../../core/services/report.service';

interface StatCard {
  label: string;
  icon: string;
  value: () => string;
  warn?: () => boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
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

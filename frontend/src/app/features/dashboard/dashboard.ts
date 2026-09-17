import { Component, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { ProductService } from '../../core/services/product.service';

interface StatCard {
  label: string;
  icon: string;
  phase?: number;
  value?: () => number | null;
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
  private readonly productService = inject(ProductService);

  readonly currentUser = this.authService.currentUser;

  readonly totalProducts = signal<number | null>(null);
  readonly lowStockProducts = signal<number | null>(null);

  readonly stats: StatCard[] = [
    { label: 'Ventas del día', icon: 'today', phase: 5 },
    { label: 'Ventas del mes', icon: 'calendar_month', phase: 5 },
    { label: 'Ganancia del mes', icon: 'trending_up', phase: 5 },
    { label: 'Productos registrados', icon: 'inventory_2', value: () => this.totalProducts() },
    { label: 'Stock bajo', icon: 'warning', value: () => this.lowStockProducts() },
    { label: 'Preventas activas', icon: 'schedule', phase: 4 },
    { label: 'Clientes registrados', icon: 'groups', phase: 3 },
    { label: 'Pagos pendientes', icon: 'payments', phase: 6 },
  ];

  constructor() {
    this.productService.search({ page: 0, size: 100 }).subscribe((res) => {
      this.totalProducts.set(res.data.totalElements);
      this.lowStockProducts.set(res.data.content.filter((p) => p.lowStock).length);
    });
  }
}

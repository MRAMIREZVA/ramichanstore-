import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

interface StatCard {
  label: string;
  icon: string;
  phase: number;
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

  readonly currentUser = this.authService.currentUser;

  readonly stats: StatCard[] = [
    { label: 'Ventas del día', icon: 'today', phase: 5 },
    { label: 'Ventas del mes', icon: 'calendar_month', phase: 5 },
    { label: 'Ganancia del mes', icon: 'trending_up', phase: 5 },
    { label: 'Productos registrados', icon: 'inventory_2', phase: 1 },
    { label: 'Stock bajo', icon: 'warning', phase: 2 },
    { label: 'Preventas activas', icon: 'schedule', phase: 4 },
    { label: 'Clientes registrados', icon: 'groups', phase: 3 },
    { label: 'Pagos pendientes', icon: 'payments', phase: 6 },
  ];
}

import { NavItem } from '../models/nav-item.model';

/**
 * Roadmap completo de módulos de RamichanStore (ver CLAUDE.md). Solo Dashboard
 * tiene página construida en Fase 0; el resto se habilita módulo por módulo.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', route: '/dashboard', available: true },
  { label: 'Productos', icon: 'inventory_2', route: '/productos', available: true },
  { label: 'Inventario', icon: 'warehouse', route: '/inventario', available: true },
  { label: 'Embarques', icon: 'flight_takeoff', route: '/embarques', available: true },
  { label: 'Clientes', icon: 'groups', route: '/clientes', available: true },
  { label: 'Pedidos', icon: 'receipt_long', route: '/pedidos', available: true },
  { label: 'Puntos', icon: 'loyalty', route: '/puntos', available: true },
  { label: 'Entregas', icon: 'local_shipping', route: '/entregas', available: true },
  { label: 'Reportes', icon: 'bar_chart', route: '/reportes', available: true },
  { label: 'Usuarios y Permisos', icon: 'admin_panel_settings', route: '/usuarios', available: true },
  { label: 'Auditoría', icon: 'fact_check', route: '/auditoria', available: true },
  { label: 'Configuración', icon: 'settings', route: '/configuracion', available: true },
];

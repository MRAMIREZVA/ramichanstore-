import { NavItem } from '../models/nav-item.model';

/**
 * Roadmap completo de módulos de RamichanStore (ver CLAUDE.md). Solo Dashboard
 * tiene página construida en Fase 0; el resto se habilita módulo por módulo.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', route: '/dashboard', available: true },
  { label: 'Productos', icon: 'inventory_2', route: '/productos', available: true },
  { label: 'Inventario', icon: 'warehouse', route: '/inventario', available: false, phase: 2 },
  { label: 'Clientes', icon: 'groups', route: '/clientes', available: false, phase: 3 },
  { label: 'Preventas', icon: 'schedule', route: '/preventas', available: false, phase: 4 },
  { label: 'Ventas', icon: 'point_of_sale', route: '/ventas', available: false, phase: 5 },
  { label: 'Pagos y Separaciones', icon: 'payments', route: '/pagos', available: false, phase: 6 },
  { label: 'Puntos', icon: 'loyalty', route: '/puntos', available: false, phase: 7 },
  { label: 'Entregas', icon: 'local_shipping', route: '/entregas', available: false, phase: 8 },
  { label: 'Reportes', icon: 'bar_chart', route: '/reportes', available: false, phase: 9 },
  { label: 'Usuarios y Permisos', icon: 'admin_panel_settings', route: '/usuarios', available: false, phase: 10 },
  { label: 'Auditoría', icon: 'fact_check', route: '/auditoria', available: false, phase: 11 },
  { label: 'Configuración', icon: 'settings', route: '/configuracion', available: false, phase: 12 },
];

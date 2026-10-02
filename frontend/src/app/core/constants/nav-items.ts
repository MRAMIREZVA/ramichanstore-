import { NavItem } from '../models/nav-item.model';

/**
 * Roadmap completo de módulos de RamichanStore (ver CLAUDE.md). Solo Dashboard
 * tiene página construida en Fase 0; el resto se habilita módulo por módulo.
 *
 * `permissions`: el código (o códigos — basta con uno) de permiso `_VIEW`/`_MANAGE` que
 * ya protege el endpoint principal de ese módulo en el backend (ver los `@PreAuthorize`
 * reales de cada controller) — nunca inventados, son un espejo 1:1 de lo que el backend
 * ya exige. "Pedidos"/"Usuarios y Permisos"/"Configuración" listan más de uno porque son
 * una sola pantalla que embebe pestañas de más de un permiso (Ventas+Preventas+Pedidos
 * web; Usuarios+Roles; Ajustes+Categorías/Marcas/Líneas/Proveedores) — entrar con
 * cualquiera de los de su lista es suficiente para no quedar afuera de toda la pantalla,
 * aunque alguna pestaña interna todavía pueda rechazar con 403 si falta el permiso fino
 * de esa pestaña puntual (Fase 75 — gating por pestaña queda como backlog aparte).
 */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', route: '/dashboard', available: true, permissions: ['DASHBOARD_VIEW'] },
  { label: 'Productos', icon: 'inventory_2', route: '/productos', available: true, permissions: ['PRODUCT_VIEW'] },
  { label: 'Inventario', icon: 'warehouse', route: '/inventario', available: true, permissions: ['INVENTORY_VIEW'] },
  { label: 'Embarques', icon: 'flight_takeoff', route: '/embarques', available: true, permissions: ['SHIPMENT_VIEW'] },
  { label: 'Clientes', icon: 'groups', route: '/clientes', available: true, permissions: ['CUSTOMER_VIEW'] },
  {
    label: 'Pedidos',
    icon: 'receipt_long',
    route: '/pedidos',
    available: true,
    permissions: ['SALE_VIEW', 'PREORDER_VIEW', 'ORDER_REQUEST_VIEW'],
  },
  { label: 'Puntos', icon: 'loyalty', route: '/puntos', available: true, permissions: ['LOYALTY_VIEW'] },
  { label: 'Entregas', icon: 'local_shipping', route: '/entregas', available: true, permissions: ['DELIVERY_VIEW'] },
  { label: 'Reportes', icon: 'bar_chart', route: '/reportes', available: true, permissions: ['REPORTS_VIEW'] },
  {
    label: 'Usuarios y Permisos',
    icon: 'admin_panel_settings',
    route: '/usuarios',
    available: true,
    permissions: ['USER_VIEW', 'ROLE_MANAGE'],
  },
  { label: 'Auditoría', icon: 'fact_check', route: '/auditoria', available: true, permissions: ['AUDIT_VIEW'] },
  {
    label: 'Configuración',
    icon: 'settings',
    route: '/configuracion',
    available: true,
    permissions: ['SETTINGS_VIEW', 'CATALOG_MANAGE'],
  },
  {
    label: 'Libro de Reclamaciones',
    icon: 'gavel',
    route: '/libro-reclamaciones',
    available: true,
    permissions: ['COMPLAINT_VIEW'],
  },
  { label: 'Escanear', icon: 'qr_code_scanner', route: '/escanear', available: true, permissions: ['PRODUCT_VIEW'] },
];

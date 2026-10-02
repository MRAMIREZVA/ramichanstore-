import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { portalAuthGuard } from './core/guards/portal-auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'RamichanStore | Panel administrativo',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'privacidad',
    title: 'RamichanStore | Política de privacidad',
    loadComponent: () =>
      import('./features/legal/privacy-policy/privacy-policy').then((m) => m.PrivacyPolicy),
  },
  {
    path: 'libro-de-reclamaciones',
    title: 'RamichanStore | Libro de Reclamaciones',
    loadComponent: () =>
      import('./features/legal/complaint-book-form/complaint-book-form').then((m) => m.ComplaintBookForm),
  },
  {
    path: 'escanear',
    title: 'RamichanStore | Escanear',
    canActivate: [authGuard, permissionGuard('PRODUCT_VIEW')],
    loadComponent: () => import('./features/scan/scan-page/scan-page').then((m) => m.ScanPage),
  },
  {
    path: '',
    title: 'RamichanStore | Panel administrativo',
    loadComponent: () => import('./layout/main-layout/main-layout').then((m) => m.MainLayout),
    canActivate: [authGuard],
    children: [
      {
        // Sin guard de permiso a propósito: es el destino al que permissionGuard redirige
        // cuando otra ruta rechaza por falta de permiso — si Dashboard también lo exigiera,
        // un rol sin PERM_DASHBOARD_VIEW quedaría en un loop de redirects hacia sí mismo. El
        // propio componente ya maneja el 403 de su API con un aviso en vez de redirigir.
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'productos',
        canActivate: [permissionGuard('PRODUCT_VIEW')],
        loadComponent: () =>
          import('./features/products/products-list/products-list').then((m) => m.ProductsList),
      },
      {
        path: 'inventario',
        canActivate: [permissionGuard('INVENTORY_VIEW')],
        loadComponent: () =>
          import('./features/inventory/inventory-list/inventory-list').then((m) => m.InventoryList),
      },
      {
        path: 'clientes',
        canActivate: [permissionGuard('CUSTOMER_VIEW')],
        loadComponent: () =>
          import('./features/customers/customers-list/customers-list').then((m) => m.CustomersList),
      },
      {
        path: 'embarques',
        canActivate: [permissionGuard('SHIPMENT_VIEW')],
        loadComponent: () =>
          import('./features/shipments/shipments-page/shipments-page').then((m) => m.ShipmentsPage),
      },
      {
        path: 'pedidos',
        canActivate: [permissionGuard('SALE_VIEW', 'PREORDER_VIEW', 'ORDER_REQUEST_VIEW')],
        loadComponent: () => import('./features/pedidos/pedidos-page/pedidos-page').then((m) => m.PedidosPage),
      },
      {
        path: 'puntos',
        canActivate: [permissionGuard('LOYALTY_VIEW')],
        loadComponent: () => import('./features/loyalty/loyalty-list/loyalty-list').then((m) => m.LoyaltyList),
      },
      {
        path: 'entregas',
        canActivate: [permissionGuard('DELIVERY_VIEW')],
        loadComponent: () =>
          import('./features/deliveries/deliveries-list/deliveries-list').then((m) => m.DeliveriesList),
      },
      {
        path: 'reportes',
        canActivate: [permissionGuard('REPORTS_VIEW')],
        loadComponent: () => import('./features/reports/reports-page/reports-page').then((m) => m.ReportsPage),
      },
      {
        path: 'usuarios',
        canActivate: [permissionGuard('USER_VIEW', 'ROLE_MANAGE')],
        loadComponent: () => import('./features/users/users-admin/users-admin').then((m) => m.UsersAdmin),
      },
      {
        path: 'auditoria',
        canActivate: [permissionGuard('AUDIT_VIEW')],
        loadComponent: () => import('./features/audit/audit-list/audit-list').then((m) => m.AuditList),
      },
      {
        path: 'configuracion',
        canActivate: [permissionGuard('SETTINGS_VIEW', 'CATALOG_MANAGE')],
        loadComponent: () => import('./features/settings/settings-page/settings-page').then((m) => m.SettingsPage),
      },
      {
        path: 'libro-reclamaciones',
        canActivate: [permissionGuard('COMPLAINT_VIEW')],
        loadComponent: () =>
          import('./features/complaint-book/complaint-list/complaint-list').then((m) => m.ComplaintList),
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  {
    path: 'catalogo',
    title: 'RamichanStore | Catálogo',
    loadComponent: () => import('./features/catalog/catalog-layout/catalog-layout').then((m) => m.CatalogLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/catalog/catalog-home/catalog-home').then((m) => m.CatalogHome),
      },
      {
        path: 'carrito',
        loadComponent: () => import('./features/catalog/cart-page/cart-page').then((m) => m.CartPage),
      },
      {
        path: 'favoritos',
        loadComponent: () => import('./features/catalog/favorites-page/favorites-page').then((m) => m.FavoritesPage),
      },
      {
        path: 'checkout',
        loadComponent: () => import('./features/catalog/checkout-page/checkout-page').then((m) => m.CheckoutPage),
      },
      {
        path: 'mi-pedido',
        loadComponent: () => import('./features/catalog/order-lookup-page/order-lookup-page').then((m) => m.OrderLookupPage),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/catalog/catalog-product-detail/catalog-product-detail').then(
            (m) => m.CatalogProductDetail,
          ),
      },
    ],
  },
  {
    path: 'portal/login',
    title: 'RamichanStore | Portal de clientes',
    loadComponent: () => import('./features/portal/portal-login/portal-login').then((m) => m.PortalLogin),
  },
  {
    path: 'portal',
    title: 'RamichanStore | Portal de clientes',
    loadComponent: () => import('./features/portal/portal-layout/portal-layout').then((m) => m.PortalLayout),
    canActivate: [portalAuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/portal/portal-home/portal-home').then((m) => m.PortalHome),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];

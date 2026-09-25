import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { portalAuthGuard } from './core/guards/portal-auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'privacidad',
    loadComponent: () =>
      import('./features/legal/privacy-policy/privacy-policy').then((m) => m.PrivacyPolicy),
  },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout/main-layout').then((m) => m.MainLayout),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'productos',
        loadComponent: () =>
          import('./features/products/products-list/products-list').then((m) => m.ProductsList),
      },
      {
        path: 'inventario',
        loadComponent: () =>
          import('./features/inventory/inventory-list/inventory-list').then((m) => m.InventoryList),
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./features/customers/customers-list/customers-list').then((m) => m.CustomersList),
      },
      {
        path: 'embarques',
        loadComponent: () =>
          import('./features/shipments/shipments-page/shipments-page').then((m) => m.ShipmentsPage),
      },
      {
        path: 'pedidos',
        loadComponent: () => import('./features/pedidos/pedidos-page/pedidos-page').then((m) => m.PedidosPage),
      },
      {
        path: 'puntos',
        loadComponent: () => import('./features/loyalty/loyalty-list/loyalty-list').then((m) => m.LoyaltyList),
      },
      {
        path: 'entregas',
        loadComponent: () =>
          import('./features/deliveries/deliveries-list/deliveries-list').then((m) => m.DeliveriesList),
      },
      {
        path: 'reportes',
        loadComponent: () => import('./features/reports/reports-page/reports-page').then((m) => m.ReportsPage),
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./features/users/users-admin/users-admin').then((m) => m.UsersAdmin),
      },
      {
        path: 'auditoria',
        loadComponent: () => import('./features/audit/audit-list/audit-list').then((m) => m.AuditList),
      },
      {
        path: 'configuracion',
        loadComponent: () => import('./features/settings/settings-page/settings-page').then((m) => m.SettingsPage),
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  {
    path: 'catalogo',
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
        path: 'checkout',
        loadComponent: () => import('./features/catalog/checkout-page/checkout-page').then((m) => m.CheckoutPage),
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
    loadComponent: () => import('./features/portal/portal-login/portal-login').then((m) => m.PortalLogin),
  },
  {
    path: 'portal',
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

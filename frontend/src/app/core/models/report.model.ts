export interface DashboardSummary {
  salesTodayTotal: number;
  salesTodayCount: number;
  salesMonthTotal: number;
  salesMonthCount: number;
  profitMonth: number;
  productsRegistered: number;
  lowStockCount: number;
  activePreorders: number;
  upcomingPreorders: number;
  registeredCustomers: number;
  pointsIssuedMonth: number;
  pendingPaymentsCount: number;
  pendingPaymentsBalance: number;
  /** Alertas operativas (Fase 82) — en 0 si tu rol no tiene permiso para ver ese módulo, no solo si no hay nada pendiente. */
  lateDeliveries: number;
  overduePreorders: number;
  pendingWebOrders: number;
  customsFlaggedShipments: number;
}

export interface DailySalesPoint {
  date: string;
  sales: number;
  profit: number;
}

export interface TopProductPoint {
  productId: number;
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface TopCategoryPoint {
  categoryId: number;
  categoryName: string;
  revenue: number;
}

export interface CustomerGrowthPoint {
  date: string;
  newCustomers: number;
}

/** Tráfico del catálogo público en el rango de fechas (Fase 63). */
export interface CatalogVisitsSummary {
  totalViews: number;
  uniqueVisitors: number;
}

/** Calcado de TopProductPoint pero por vistas de ficha, no por ingresos (Fase 63). */
export interface TopViewedProductPoint {
  productId: number;
  productName: string;
  views: number;
}

/** Reservas de preventa en el rango — deliberadamente separadas de Ventas, nunca sumadas a sus totales. */
export interface PreorderReservationsSummary {
  totalReservations: number;
  totalDeposits: number;
}

/** Calcado de DailySalesPoint pero para reservas de preventa. */
export interface DailyReservationsPoint {
  date: string;
  reservationsCount: number;
}

/** Calcado de TopProductPoint pero por cantidad reservada en preventa, no por ingresos de Ventas. */
export interface TopReservedProductPoint {
  productId: number;
  productName: string;
  quantityReserved: number;
}

export interface ReportCharts {
  dailySales: DailySalesPoint[];
  topProducts: TopProductPoint[];
  topCategories: TopCategoryPoint[];
  customerGrowth: CustomerGrowthPoint[];
  catalogVisits: CatalogVisitsSummary;
  topViewedProducts: TopViewedProductPoint[];
  preorderReservations: PreorderReservationsSummary;
  dailyReservations: DailyReservationsPoint[];
  topReservedProducts: TopReservedProductPoint[];
}

/** Saldo pendiente de un cliente, desglosado por origen (Ventas/Separaciones/Preventas) — snapshot en vivo, no por rango de fechas. */
export interface CustomerDebt {
  customerId: number;
  customerName: string;
  customerPhone: string | null;
  customerWhatsapp: string | null;
  salesBalance: number;
  separationsBalance: number;
  preordersBalance: number;
  totalBalance: number;
}

/** Una reserva de preventa activa (campaña ni Entregada ni Cancelada) — una fila por reserva, no por cliente. */
export interface CustomerActivePreorder {
  customerId: number;
  customerName: string;
  customerPhone: string | null;
  customerWhatsapp: string | null;
  reservationId: number;
  productSku: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  amountPaid: number;
  balanceDue: number;
  preorderStatus: string;
  estimatedArrivalDate: string | null;
}

export interface ReceivablesReport {
  customersWithDebt: CustomerDebt[];
  activePreorders: CustomerActivePreorder[];
}

/**
 * Snapshot (sin rango de fechas) de cuánto vale el stock actual. `stockValueAtCost` queda
 * subestimado mientras `productsWithoutCost` sea alto — un producto con costo en S/0 aporta
 * S/0 a esa suma aunque sí tenga stock real.
 */
export interface InventoryValuation {
  stockValueAtCost: number;
  stockValueAtSalePrice: number;
  potentialProfit: number;
  totalProducts: number;
  productsWithoutCost: number;
}

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

export interface ReportCharts {
  dailySales: DailySalesPoint[];
  topProducts: TopProductPoint[];
  topCategories: TopCategoryPoint[];
  customerGrowth: CustomerGrowthPoint[];
}

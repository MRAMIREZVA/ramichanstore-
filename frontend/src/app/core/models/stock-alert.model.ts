/** Submit público (sin login) desde el detalle de un producto agotado del catálogo. */
export interface StockAlertSubmission {
  productId: number;
  customerName: string;
  customerPhone: string;
}

export interface StockAlert {
  id: number;
  productId: number;
  customerName: string;
  customerPhone: string;
  notified: boolean;
  notifiedAt: string | null;
  createdAt: string;
}

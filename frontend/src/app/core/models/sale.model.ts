export type PaymentMethod = 'YAPE' | 'PLIN' | 'TRANSFERENCIA' | 'EFECTIVO' | 'TARJETA' | 'OTROS';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  YAPE: 'Yape',
  PLIN: 'Plin',
  TRANSFERENCIA: 'Transferencia',
  EFECTIVO: 'Efectivo',
  TARJETA: 'Tarjeta',
  OTROS: 'Otros',
};

export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED';

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Pendiente',
  PARTIAL: 'Parcial',
  PAID: 'Pagado',
  CANCELLED: 'Cancelado',
};

export type DeliveryMethod = 'PICKUP' | 'DELIVERY' | 'AGENCY';

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  PICKUP: 'Recojo en tienda',
  DELIVERY: 'Delivery',
  AGENCY: 'Envío por agencia',
};

export interface SaleItem {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  productMainImageUrl: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
  unitCost: number;
  subtotal: number;
}

export interface Sale {
  id: number;
  /** Código legible del pedido (ej. "V-000123"), calculado por el backend a partir del id. */
  orderCode: string;
  customerId: number | null;
  customerName: string | null;
  customerPhone: string | null;
  customerWhatsapp: string | null;
  saleDate: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  deliveryMethod: DeliveryMethod;
  items: SaleItem[];
  subtotal: number;
  total: number;
  totalCost: number;
  profit: number;
  pointsGenerated: number;
  notes: string | null;
  createdAt: string;
}

export interface SaleItemRequest {
  productId: number;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export interface SaleRequest {
  customerId: number | null;
  saleDate: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  deliveryMethod: DeliveryMethod;
  items: SaleItemRequest[];
  notes: string | null;
}

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

/** VENTA (pago de una sola vez, genera puntos) o SEPARACION (abonos, nunca genera puntos) — antes eran dos entidades separadas. */
export type SaleType = 'VENTA' | 'SEPARACION';

export const SALE_TYPE_LABELS: Record<SaleType, string> = {
  VENTA: 'Venta directa',
  SEPARACION: 'Separación (abonos)',
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

/** Abono individual contra una venta type=SEPARACION. */
export interface SalePayment {
  id: number;
  saleId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  notes: string | null;
  userId: number;
  username: string;
  createdAt: string;
}

export interface SalePaymentRequest {
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  notes: string | null;
}

export interface Sale {
  id: number;
  /** Código legible del pedido (ej. "V-000123"), calculado por el backend a partir del id. */
  orderCode: string;
  type: SaleType;
  customerId: number | null;
  customerName: string | null;
  customerPhone: string | null;
  customerWhatsapp: string | null;
  saleDate: string;
  /** Null cuando type=SEPARACION — nunca existió a nivel de cabecera para una separación. */
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus;
  /** Null cuando type=SEPARACION. */
  deliveryMethod: DeliveryMethod | null;
  /** Solo tiene sentido para type=SEPARACION — fecha límite de pago de los abonos. */
  limitDate: string | null;
  overdue: boolean;
  items: SaleItem[];
  subtotal: number;
  total: number;
  totalCost: number;
  profit: number;
  pointsGenerated: number;
  /** Calculados por el backend: desde el ledger de abonos si type=SEPARACION, o total/0 según paymentStatus si type=VENTA. */
  amountPaid: number;
  balanceDue: number;
  payments: SalePayment[];
  notes: string | null;
  createdAt: string;
}

export interface SaleItemRequest {
  productId: number;
  quantity: number;
  unitPrice: number;
  discount: number;
}

/**
 * paymentMethod/deliveryMethod solo son obligatorios si type=VENTA (validado en el formulario y
 * de nuevo en el backend); limitDate solo si type=SEPARACION.
 */
export interface SaleRequest {
  type: SaleType;
  customerId: number | null;
  saleDate: string;
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus;
  deliveryMethod: DeliveryMethod | null;
  limitDate: string | null;
  items: SaleItemRequest[];
  notes: string | null;
}

/** Corrige precio unitario/descuento de líneas ya creadas — producto y cantidad quedan fijos. */
export interface UpdateSaleItemsRequest {
  items: { detailId: number; unitPrice: number; discount: number }[];
}

/** Agrega un producto NUEVO a una venta ya creada — a diferencia de UpdateSaleItemsRequest, SÍ descuenta stock. */
export interface AddSaleItemRequest {
  productId: number;
  quantity: number;
  unitPrice: number;
  discount: number;
}

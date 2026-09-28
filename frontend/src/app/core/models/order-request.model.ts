import { DeliveryMethod, PaymentMethod, PaymentStatus } from './sale.model';

export type OrderRequestStatus = 'PENDING' | 'CONVERTED' | 'REJECTED';

export const ORDER_REQUEST_STATUS_LABELS: Record<OrderRequestStatus, string> = {
  PENDING: 'Pendiente',
  CONVERTED: 'Convertido',
  REJECTED: 'Rechazado',
};

/** STOCK se convierte en una venta real; PREORDER se convierte en reserva(s) de preventa — ver OrderRequestService (backend). */
export type OrderRequestType = 'STOCK' | 'PREORDER';

export const ORDER_REQUEST_TYPE_LABELS: Record<OrderRequestType, string> = {
  STOCK: 'En stock',
  PREORDER: 'Preventa',
};

export interface CartItemRequest {
  productId: number;
  quantity: number;
}

/** Submit público del carrito — ver CartService/checkout-page. */
export interface OrderRequestSubmission {
  guestName: string;
  guestPhone: string;
  guestWhatsapp: string | null;
  guestAddress: string | null;
  guestDistrict: string | null;
  guestProvince: string | null;
  guestDepartment: string | null;
  preferredPaymentMethod: PaymentMethod;
  deliveryMethod: DeliveryMethod;
  deliveryAgencyId: number | null;
  recipientDni: string | null;
  recipientName: string | null;
  recipientPhone: string | null;
  notes: string | null;
  items: CartItemRequest[];
}

export interface OrderRequestItem {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  productMainImageUrl: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  /** Solo cuando el ítem es de preventa (campaña resuelta en el submit) — ver ConvertToReservationsRequest. */
  preorderId: number | null;
  /** Depósito mínimo sugerido (minDepositAmount × quantity) para precargar el formulario de conversión a reserva. */
  suggestedDeposit: number | null;
}

/** Versión pública mínima para el polling del checkout mientras espera la confirmación de un pago con Yape. */
export interface OrderRequestStatusInfo {
  id: number;
  status: OrderRequestStatus;
  convertedSaleId: number | null;
}

/** "Buscar mi pedido" (Fase 47) — versión pública de OrderRequest, sin dirección/DNI del destinatario. */
export interface PublicOrderRequestInfo {
  id: number;
  requestType: OrderRequestType;
  status: OrderRequestStatus;
  rejectionReason: string | null;
  items: OrderRequestItem[];
  total: number;
  preferredPaymentMethod: PaymentMethod;
  deliveryMethod: DeliveryMethod;
  createdAt: string;
  convertedSaleId: number | null;
  saleOrderCode: string | null;
  salePaymentStatus: PaymentStatus | null;
}

export interface OrderRequest {
  id: number;
  guestName: string;
  guestPhone: string;
  guestWhatsapp: string | null;
  guestAddress: string | null;
  guestDistrict: string | null;
  guestProvince: string | null;
  guestDepartment: string | null;
  preferredPaymentMethod: PaymentMethod;
  deliveryMethod: DeliveryMethod;
  deliveryAgencyId: number | null;
  deliveryAgencyName: string | null;
  recipientDni: string | null;
  recipientName: string | null;
  recipientPhone: string | null;
  notes: string | null;
  items: OrderRequestItem[];
  total: number;
  requestType: OrderRequestType;
  status: OrderRequestStatus;
  rejectionReason: string | null;
  convertedSaleId: number | null;
  createdAt: string;
  /** El cliente subió la captura de su pago con Yape (Fase 52); la imagen se pide aparte, autenticada. */
  hasPaymentVoucher: boolean;
  paymentVoucherUploadedAt: string | null;
  /** Resultado del último intento de pago EN LÍNEA, o null si nunca hubo uno (lo normal: el pedido solo se envió). */
  onlinePaymentStatus: OnlinePaymentStatus | null;
}

export type OnlinePaymentStatus = 'PENDING' | 'PAID' | 'UNPAID';

/** Cómo llegó el dinero (o si no llegó) — derivado de los dos datos de pago que trae el pedido. */
export type OrderPaymentState = 'PAID_ONLINE' | 'VOUCHER' | 'ATTEMPT_FAILED' | 'NONE';

export function orderPaymentState(order: OrderRequest): OrderPaymentState {
  if (order.onlinePaymentStatus === 'PAID') return 'PAID_ONLINE';
  if (order.hasPaymentVoucher) return 'VOUCHER';
  if (order.onlinePaymentStatus === 'UNPAID') return 'ATTEMPT_FAILED';
  return 'NONE';
}

export const ORDER_PAYMENT_STATE_LABELS: Record<OrderPaymentState, string> = {
  PAID_ONLINE: 'Pagado en línea',
  VOUCHER: 'Comprobante por validar',
  ATTEMPT_FAILED: 'Intento de pago fallido',
  NONE: 'Sin pago',
};

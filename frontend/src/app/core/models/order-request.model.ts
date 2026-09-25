import { DeliveryMethod, PaymentMethod } from './sale.model';

export type OrderRequestStatus = 'PENDING' | 'CONVERTED' | 'REJECTED';

export const ORDER_REQUEST_STATUS_LABELS: Record<OrderRequestStatus, string> = {
  PENDING: 'Pendiente',
  CONVERTED: 'Convertido a venta',
  REJECTED: 'Rechazado',
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
}

/** Versión pública mínima para el polling del checkout mientras espera la confirmación de un pago con Yape. */
export interface OrderRequestStatusInfo {
  id: number;
  status: OrderRequestStatus;
  convertedSaleId: number | null;
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
  status: OrderRequestStatus;
  rejectionReason: string | null;
  convertedSaleId: number | null;
  createdAt: string;
}

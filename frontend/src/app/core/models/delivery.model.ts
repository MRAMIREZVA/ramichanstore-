import { DeliveryMethod, PaymentStatus } from './sale.model';

export type DeliveryStatus = 'PENDING' | 'PREPARING' | 'READY' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  PENDING: 'Pendiente',
  PREPARING: 'Preparando',
  READY: 'Listo',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

export type PurchaseType = 'VENTA' | 'SEPARACION';

/** Una compra (venta o separación, nunca ambas) incluida en una entrega. */
export interface DeliveryItem {
  id: number;
  type: PurchaseType;
  saleId: number | null;
  separationId: number | null;
  purchaseDate: string;
  summary: string;
  total: number;
  paymentStatus: PaymentStatus;
}

/**
 * Desde Fase 17 una entrega es el seguimiento logístico de UN CLIENTE, no de
 * una sola venta: agrupa varias compras (ventas y/o separaciones) de ese
 * cliente en `items`.
 */
export interface Delivery {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string | null;
  customerWhatsapp: string | null;
  items: DeliveryItem[];
  totalAmount: number;
  deliveryType: DeliveryMethod;
  address: string | null;
  district: string | null;
  department: string | null;
  province: string | null;
  deliveryAgencyId: number | null;
  deliveryAgencyName: string | null;
  recipientDni: string | null;
  recipientName: string | null;
  recipientPhone: string | null;
  courier: string | null;
  scheduledDate: string;
  status: DeliveryStatus;
  notes: string | null;
}

export interface DeliveryRequest {
  customerId: number;
  saleIds: number[];
  separationIds: number[];
  deliveryType: DeliveryMethod;
  address: string | null;
  district: string | null;
  department: string | null;
  province: string | null;
  deliveryAgencyId: number | null;
  recipientDni: string | null;
  recipientName: string | null;
  recipientPhone: string | null;
  courier: string | null;
  scheduledDate: string;
  status: DeliveryStatus;
  notes: string | null;
}

/** Compra del cliente candidata a incluirse en una entrega nueva o existente. */
export interface PendingPurchase {
  type: PurchaseType;
  id: number;
  purchaseDate: string;
  summary: string;
  total: number;
  paymentStatus: PaymentStatus;
}

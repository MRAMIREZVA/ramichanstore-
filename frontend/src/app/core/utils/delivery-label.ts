import { DELIVERY_STATUS_LABELS, Delivery, DeliveryStatus, PurchaseType } from '../models/delivery.model';
import { PaymentStatus } from '../models/sale.model';

/**
 * Clave `tipo-id` para ubicar la entrega (si existe) que agrupa una compra
 * puntual — desde Fase 17 una entrega puede agrupar varias compras (ventas
 * y/o separaciones) de un cliente, así que la relación ya no es más
 * "un Map<saleId, Delivery>" sino "un Map<tipo-id, Delivery>" armado a partir
 * de `delivery.items`. Compartido entre portal-home y customer-detail.
 */
export function purchaseKey(type: PurchaseType, id: number): string {
  return `${type}-${id}`;
}

export function buildDeliveryLookup(deliveries: Delivery[]): Map<string, Delivery> {
  const map = new Map<string, Delivery>();
  for (const delivery of deliveries) {
    for (const item of delivery.items) {
      const purchaseId = item.type === 'VENTA' ? item.saleId : item.separationId;
      if (purchaseId != null) {
        map.set(purchaseKey(item.type, purchaseId), delivery);
      }
    }
  }
  return map;
}

/**
 * Etiqueta de estado de entrega para una compra — combina estado + tipo de
 * entrega para que "Listo" se lea como "Listo para recoger en tienda" o
 * "Listo para enviar" según corresponda. Una compra cancelada nunca muestra
 * "por coordinar" — no tiene sentido coordinar la entrega de algo que no se
 * concretó. Compartido entre el portal del cliente (portal-home) y la ficha
 * de cliente del admin (customer-detail) para no duplicar la lógica.
 */
export function deliveryLabelFor(delivery: Delivery | undefined, paymentStatus: PaymentStatus): string {
  if (paymentStatus === 'CANCELLED') return '—';
  if (!delivery) return 'Por coordinar';
  if (delivery.status === 'READY') {
    return delivery.deliveryType === 'PICKUP' ? 'Listo para recoger en tienda' : 'Listo para enviar';
  }
  return DELIVERY_STATUS_LABELS[delivery.status];
}

export function deliveryStatusAttrFor(delivery: Delivery | undefined, paymentStatus: PaymentStatus): DeliveryStatus | 'NONE' {
  if (paymentStatus === 'CANCELLED') return 'NONE';
  return delivery?.status ?? 'NONE';
}

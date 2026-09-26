import { DELIVERY_STATUS_LABELS, Delivery, DeliveryStatus } from '../models/delivery.model';
import { PaymentStatus } from '../models/sale.model';

/**
 * Ubica la entrega (si existe) que agrupa una compra puntual, indexada por id de venta —
 * desde que Ventas y Separaciones se fusionaron en una sola entidad (Sale, discriminada por
 * `type`), un id de venta ya es único sin importar el tipo, así que el mapa ya no necesita
 * un prefijo `tipo-id` como antes. Compartido entre portal-home y customer-detail.
 */
export function buildDeliveryLookup(deliveries: Delivery[]): Map<number, Delivery> {
  const map = new Map<number, Delivery>();
  for (const delivery of deliveries) {
    for (const item of delivery.items) {
      map.set(item.saleId, delivery);
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

/** Antes un enum fijo; ahora una maestra editable por el admin (ver ShipmentTypeOption). */
export interface ShipmentTypeOption {
  id: number;
  name: string;
  notes: string | null;
}

export interface ShipmentTypeOptionRequest {
  name: string;
  notes: string | null;
}

export type ShipmentStatus =
  | 'PENDIENTE_ENVIO'
  | 'EN_COTIZACION_ENVIO'
  | 'PENDIENTE_PAGO'
  | 'EN_CAMINO'
  | 'LLEGO_A_SERPOST'
  | 'LLEGO_A_PERU'
  | 'OBSERVADO_ADUANAS'
  | 'LISTO_PARA_DELIVERY'
  | 'EN_TIENDA';

/** Fase 84: orden corregido — "Llegó a Perú" estaba al final, después de "En tienda"/"Listo para delivery" (imposible: un paquete siempre llega al país antes de eso). */
export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  PENDIENTE_ENVIO: 'Pendiente envío',
  EN_COTIZACION_ENVIO: 'En cotización de envío',
  PENDIENTE_PAGO: 'Pendiente pago',
  EN_CAMINO: 'En camino',
  LLEGO_A_SERPOST: 'Llegó a Serpost',
  LLEGO_A_PERU: 'Llegó a Perú',
  OBSERVADO_ADUANAS: 'Observado x Aduanas',
  LISTO_PARA_DELIVERY: 'Listo para delivery',
  EN_TIENDA: 'En tienda',
};

export interface ShipmentHolder {
  id: number;
  name: string;
  notes: string | null;
}

export interface ShipmentHolderRequest {
  name: string;
  notes: string | null;
}

/** A nombre de quien va el paquete físicamente (aduanas/envío) — distinto de ShipmentHolder (quien compra con su cuenta ZEN). El nombre SÍ puede repetirse. */
export interface ShipmentRecipient {
  id: number;
  name: string;
  notes: string | null;
}

export interface ShipmentRecipientRequest {
  name: string;
  notes: string | null;
}

export interface ShipmentItem {
  id: number;
  articleCode: string | null;
  description: string;
  quantity: number;
  weight: number;
  cost: number | null;
  commission: number | null;
  transactionSurcharge: number | null;
  imageUrl: string | null;
  /** true si todavía no está asignado a ningún embarque (pool de artículos pre-registrados, Fase 40). */
  pending: boolean;
  /** Solo llenos cuando pending=false — a qué embarque quedó asignado y en qué estado (Fase 69). */
  shipmentId: number | null;
  shipmentCode: string | null;
  shipmentStatus: ShipmentStatus | null;
}

export interface ShipmentItemRequest {
  id: number | null;
  articleCode: string | null;
  description: string;
  quantity: number;
  weight: number;
  cost: number | null;
  commission: number | null;
  transactionSurcharge: number | null;
}

export type ShipmentDocumentType = 'INVOICE' | 'DIF' | 'DIF_VOUCHER' | 'FACTURA';

export const SHIPMENT_DOCUMENT_TYPE_LABELS: Record<ShipmentDocumentType, string> = {
  INVOICE: 'Invoice',
  DIF: 'DIF',
  DIF_VOUCHER: 'Voucher de pago del DIF',
  FACTURA: 'Factura',
};

export interface ShipmentDocument {
  id: number;
  documentType: ShipmentDocumentType;
  fileName: string;
  url: string;
  uploadedAt: string;
}

export interface Shipment {
  id: number;
  code: string;
  holderId: number;
  holderName: string;
  recipientId: number | null;
  recipientName: string | null;
  zenOrderNumber: string | null;
  productCost: number | null;
  shippingCost: number | null;
  commissionCost: number | null;
  domesticJapanShippingCost: number | null;
  additionalCost: number | null;
  handlingCost: number | null;
  /** Opcional — no todos los barcos pagan aduana. Solo suma a finalCost, nunca a totalSoles. */
  customsCharge: number | null;
  exchangeRate: number | null;
  totalDollars: number | null;
  totalSoles: number | null;
  finalCost: number | null;
  shipmentTypeId: number;
  shipmentTypeName: string;
  departureDate: string | null;
  arrivalDate: string | null;
  transitDays: number | null;
  possibleArrivalDate: string | null;
  figuresWeight: number | null;
  finalWeight: number | null;
  weightDifference: number | null;
  status: ShipmentStatus;
  notes: string | null;
  wentThroughCustoms: boolean;
  customsTaxAmount: number | null;
  /** Seguimiento en línea de Serpost (Fase 80) — serpostStatus/serpostStatusAt son el ÚLTIMO estado conocido, nunca se borran por una consulta fallida. */
  serpostTrackingCode: string | null;
  serpostStatus: string | null;
  serpostStatusAt: string | null;
  serpostCheckedAt: string | null;
  items: ShipmentItem[];
  documents: ShipmentDocument[];
}

export interface ShipmentRequest {
  code: string;
  holderId: number;
  recipientId: number;
  zenOrderNumber: string | null;
  productCost: number | null;
  shippingCost: number | null;
  commissionCost: number | null;
  domesticJapanShippingCost: number | null;
  handlingCost: number | null;
  customsCharge: number | null;
  exchangeRate: number | null;
  shipmentTypeId: number;
  departureDate: string | null;
  arrivalDate: string | null;
  possibleArrivalDate: string | null;
  figuresWeight: number | null;
  finalWeight: number | null;
  status: ShipmentStatus;
  notes: string | null;
  wentThroughCustoms: boolean;
  customsTaxAmount: number | null;
  serpostTrackingCode: string | null;
  items: ShipmentItemRequest[];
}

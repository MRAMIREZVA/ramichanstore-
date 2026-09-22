export type ShipmentType = 'EMS' | 'AVIA' | 'BARCO';

export const SHIPMENT_TYPE_LABELS: Record<ShipmentType, string> = {
  EMS: 'EMS',
  AVIA: 'Aéreo',
  BARCO: 'Marítimo',
};

export type ShipmentStatus =
  | 'PENDIENTE_ENVIO'
  | 'EN_COTIZACION_ENVIO'
  | 'PENDIENTE_PAGO'
  | 'EN_CAMINO'
  | 'LLEGO_A_SERPOST'
  | 'OBSERVADO_ADUANAS'
  | 'LISTO_PARA_DELIVERY'
  | 'EN_TIENDA'
  | 'LLEGO_A_PERU';

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  PENDIENTE_ENVIO: 'Pendiente envío',
  EN_COTIZACION_ENVIO: 'En cotización de envío',
  PENDIENTE_PAGO: 'Pendiente pago',
  EN_CAMINO: 'En camino',
  LLEGO_A_SERPOST: 'Llegó a Serpost',
  OBSERVADO_ADUANAS: 'Observado x Aduanas',
  LISTO_PARA_DELIVERY: 'Listo para delivery',
  EN_TIENDA: 'En tienda',
  LLEGO_A_PERU: 'Llegó a Perú',
};

export interface ShipmentHolder {
  id: number;
  name: string;
  zenAccount: string | null;
  notes: string | null;
}

export interface ShipmentHolderRequest {
  name: string;
  zenAccount: string | null;
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
}

export interface ShipmentItemRequest {
  articleCode: string | null;
  description: string;
  quantity: number;
}

export interface Shipment {
  id: number;
  code: string;
  holderId: number;
  holderName: string;
  holderZenAccount: string | null;
  recipientId: number | null;
  recipientName: string | null;
  zenOrderNumber: string | null;
  productCost: number | null;
  shippingCost: number | null;
  commissionCost: number | null;
  domesticJapanShippingCost: number | null;
  additionalCost: number | null;
  totalSoles: number | null;
  totalDollars: number | null;
  handlingCost: number | null;
  finalCost: number | null;
  shipmentType: ShipmentType;
  departureDate: string | null;
  arrivalDate: string | null;
  transitDays: number | null;
  travelDays: number | null;
  possibleArrivalDate: string | null;
  figuresWeight: number | null;
  finalWeight: number | null;
  weightDifference: number | null;
  status: ShipmentStatus;
  notes: string | null;
  items: ShipmentItem[];
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
  additionalCost: number | null;
  totalSoles: number | null;
  totalDollars: number | null;
  handlingCost: number | null;
  finalCost: number | null;
  shipmentType: ShipmentType;
  departureDate: string | null;
  arrivalDate: string | null;
  travelDays: number | null;
  possibleArrivalDate: string | null;
  figuresWeight: number | null;
  finalWeight: number | null;
  status: ShipmentStatus;
  notes: string | null;
  items: ShipmentItemRequest[];
}

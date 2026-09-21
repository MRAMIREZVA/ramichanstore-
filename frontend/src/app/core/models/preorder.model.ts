export type PreorderStatus = 'COMING_SOON' | 'ACTIVE' | 'SOLD_OUT' | 'IN_TRANSIT' | 'RECEIVED' | 'DELIVERED' | 'CANCELLED';

export const PREORDER_STATUS_LABELS: Record<PreorderStatus, string> = {
  COMING_SOON: 'Próximamente',
  ACTIVE: 'Preventa activa',
  SOLD_OUT: 'Agotada',
  IN_TRANSIT: 'En camino',
  RECEIVED: 'Recibida',
  DELIVERED: 'Entregada',
  CANCELLED: 'Cancelada',
};

/** Reservas de UN cliente vistas desde el admin (ficha del cliente), cruzando varias campañas — ver CustomerReservationResponse. */
export interface CustomerReservation {
  id: number;
  preorderId: number;
  productSku: string;
  productName: string;
  productMainImageUrl: string | null;
  quantity: number;
  depositAmount: number;
  preorderStatus: PreorderStatus;
  limitDate: string;
  estimatedArrivalDate: string | null;
  createdAt: string;
}

export interface Preorder {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  productMainImageUrl: string | null;
  lineName: string | null;
  brandName: string;
  size: string | null;
  salePrice: number;
  estimatedCost: number;
  estimatedProfit: number;
  minDepositAmount: number;
  startDate: string;
  limitDate: string;
  estimatedArrivalDate: string | null;
  availableQuantity: number;
  reservedQuantity: number;
  availableSlots: number;
  status: PreorderStatus;
  notes: string | null;
}

export interface PreorderRequest {
  productId: number;
  minDepositAmount: number;
  startDate: string;
  limitDate: string;
  estimatedArrivalDate: string | null;
  availableQuantity: number;
  status: PreorderStatus;
  notes: string | null;
}

export interface PreorderReservation {
  id: number;
  preorderId: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  customerWhatsapp: string | null;
  productSku: string;
  productName: string;
  productMainImageUrl: string | null;
  preorderStatus: PreorderStatus;
  limitDate: string;
  estimatedArrivalDate: string | null;
  quantity: number;
  depositAmount: number;
  notes: string | null;
  createdAt: string;
}

export interface PreorderReservationRequest {
  customerId: number;
  quantity: number;
  depositAmount: number;
  notes: string | null;
}

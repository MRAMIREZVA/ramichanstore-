export type LoyaltyMovementType = 'COMPRA' | 'CANJE' | 'AJUSTE_MANUAL' | 'BONIFICACION' | 'VENCIMIENTO';

export const LOYALTY_MOVEMENT_TYPE_LABELS: Record<LoyaltyMovementType, string> = {
  COMPRA: 'Compra',
  CANJE: 'Canje',
  AJUSTE_MANUAL: 'Ajuste manual',
  BONIFICACION: 'Bonificación',
  VENCIMIENTO: 'Vencimiento',
};

/** COMPRA y BONIFICACION suman; CANJE y VENCIMIENTO restan; AJUSTE_MANUAL es un delta con signo. */
export const LOYALTY_TYPES_THAT_INCREASE: LoyaltyMovementType[] = ['COMPRA', 'BONIFICACION'];

export interface LoyaltyMovement {
  id: number;
  customerId: number;
  customerName: string;
  movementType: LoyaltyMovementType;
  points: number;
  reason: string;
  saleId: number | null;
  userId: number;
  username: string;
  createdAt: string;
}

export interface LoyaltyMovementRequest {
  customerId: number;
  movementType: LoyaltyMovementType;
  points: number;
  reason: string;
}

export interface LoyaltyBalance {
  customerId: number;
  customerName: string;
  balance: number;
}

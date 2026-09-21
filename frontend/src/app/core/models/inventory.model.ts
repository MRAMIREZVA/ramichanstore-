export type MovementType = 'INGRESO' | 'VENTA' | 'RESERVA' | 'SEPARACION' | 'DEVOLUCION' | 'AJUSTE' | 'PERDIDA';

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  INGRESO: 'Ingreso',
  VENTA: 'Venta',
  RESERVA: 'Reserva',
  SEPARACION: 'Separación',
  DEVOLUCION: 'Devolución',
  AJUSTE: 'Ajuste',
  PERDIDA: 'Pérdida',
};

/** INGRESO y DEVOLUCION suman al stock; el resto (salvo AJUSTE) resta. AJUSTE es un delta con signo. */
export const MOVEMENT_TYPES_THAT_INCREASE: MovementType[] = ['INGRESO', 'DEVOLUCION'];

export interface InventoryMovement {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  movementType: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  observation: string | null;
  userId: number;
  username: string;
  createdAt: string;
}

export interface InventoryMovementRequest {
  productId: number;
  movementType: MovementType;
  quantity: number;
  reason: string;
  observation: string | null;
}

import { PaymentMethod, PaymentStatus } from './sale.model';

export interface Separation {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  customerWhatsapp: string | null;
  productId: number;
  productSku: string;
  productName: string;
  productMainImageUrl: string | null;
  quantity: number;
  totalPrice: number;
  amountPaid: number;
  balanceDue: number;
  separationDate: string;
  limitDate: string;
  status: PaymentStatus;
  overdue: boolean;
  notes: string | null;
}

export interface SeparationRequest {
  customerId: number;
  productId: number;
  quantity: number;
  totalPrice: number;
  separationDate: string;
  limitDate: string;
  notes: string | null;
}

export interface SeparationPayment {
  id: number;
  separationId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  notes: string | null;
  userId: number;
  username: string;
  createdAt: string;
}

export interface SeparationPaymentRequest {
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  notes: string | null;
}

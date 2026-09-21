export interface PortalCustomer {
  id: number;
  fullName: string;
  documentNumber: string | null;
  phone: string;
  email: string | null;
}

export interface PortalLoginRequest {
  username: string;
  password: string;
}

export interface PortalLoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  customer: PortalCustomer;
}

export interface PortalReservation {
  id: number;
  productSku: string;
  productName: string;
  productMainImageUrl: string | null;
  quantity: number;
  depositAmount: number;
  preorderStatus: string;
  limitDate: string;
  estimatedArrivalDate: string | null;
  reservedAt: string;
}

export interface PortalLoyaltyBalance {
  customerId: number;
  customerName: string;
  balance: number;
}

export type DocumentType = 'DNI' | 'RUC' | 'CE' | 'PASSPORT' | 'OTHER';

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  DNI: 'DNI',
  RUC: 'RUC',
  CE: 'Carné de extranjería',
  PASSPORT: 'Pasaporte',
  OTHER: 'Otro',
};

export type CustomerStatus = 'ACTIVE' | 'INACTIVE';

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
};

export interface Customer {
  id: number;
  fullName: string;
  documentType: DocumentType | null;
  documentNumber: string | null;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  district: string | null;
  address: string | null;
  status: CustomerStatus;
  notes: string | null;
  registeredAt: string;
  portalEnabled: boolean;
  portalUsername: string | null;
}

export interface CustomerRequest {
  fullName: string;
  documentType: DocumentType | null;
  documentNumber: string | null;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  district: string | null;
  address: string | null;
  status: CustomerStatus;
  notes: string | null;
}

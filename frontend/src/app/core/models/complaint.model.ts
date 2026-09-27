/** RECLAMO: disconformidad relacionada a los productos/servicios. QUEJA: disconformidad NO relacionada a ellos (o mal trato al consumidor). */
export type ComplaintType = 'RECLAMO' | 'QUEJA';

export const COMPLAINT_TYPE_LABELS: Record<ComplaintType, string> = {
  RECLAMO: 'Reclamo',
  QUEJA: 'Queja',
};

export type ComplaintStatus = 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTO';

export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
  PENDIENTE: 'Pendiente',
  EN_PROCESO: 'En proceso',
  RESUELTO: 'Resuelto',
};

/** Submit público (sin login) del Libro de Reclamaciones — ver complaint-book-form. */
export interface ComplaintSubmission {
  type: ComplaintType;
  consumerFullName: string;
  consumerDocumentType: string;
  consumerDocumentNumber: string;
  consumerAddress: string;
  consumerEmail: string;
  consumerPhone: string;
  isMinor: boolean;
  guardianFullName: string | null;
  guardianDocumentNumber: string | null;
  goodDescription: string;
  claimedAmount: number | null;
  detail: string;
  consumerRequest: string;
}

export interface RespondComplaintRequest {
  status: ComplaintStatus;
  providerResponse: string;
}

export interface Complaint {
  id: number;
  folioNumber: string;
  type: ComplaintType;
  consumerFullName: string;
  consumerDocumentType: string;
  consumerDocumentNumber: string;
  consumerAddress: string;
  consumerEmail: string;
  consumerPhone: string;
  isMinor: boolean;
  guardianFullName: string | null;
  guardianDocumentNumber: string | null;
  goodDescription: string;
  claimedAmount: number | null;
  detail: string;
  consumerRequest: string;
  status: ComplaintStatus;
  providerResponse: string | null;
  respondedAt: string | null;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
}

export interface Brand {
  id: number;
  name: string;
  description: string | null;
}

export interface ProductLine {
  id: number;
  name: string;
  brandId: number | null;
  brandName: string | null;
  description: string | null;
}

export interface Supplier {
  id: number;
  name: string;
  company: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  country: string | null;
  address: string | null;
  notes: string | null;
}

export interface NameDescriptionRequest {
  name: string;
  description: string | null;
}

export interface ProductLineRequest {
  name: string;
  brandId: number | null;
  description: string | null;
}

export interface SupplierRequest {
  name: string;
  company: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  country: string | null;
  address: string | null;
  notes: string | null;
}

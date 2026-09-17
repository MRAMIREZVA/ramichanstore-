export type ProductStatus = 'AVAILABLE' | 'OUT_OF_STOCK' | 'PREORDER' | 'COMING_SOON' | 'DISCONTINUED';

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  AVAILABLE: 'Disponible',
  OUT_OF_STOCK: 'Agotado',
  PREORDER: 'Preventa',
  COMING_SOON: 'Próximamente',
  DISCONTINUED: 'Descontinuado',
};

export interface Product {
  id: number;
  sku: string;
  name: string;
  characterName: string | null;
  franchise: string | null;
  brandId: number;
  brandName: string;
  categoryId: number;
  categoryName: string;
  lineId: number | null;
  lineName: string | null;
  description: string | null;
  mainImageUrl: string | null;
  additionalImageUrls: string[];
  size: string | null;
  purchasePrice: number;
  additionalCosts: number;
  totalCost: number;
  salePrice: number;
  profit: number;
  marginPercent: number;
  currentStock: number;
  minStock: number;
  lowStock: boolean;
  status: ProductStatus;
  location: string | null;
  entryDate: string | null;
  supplierId: number | null;
  supplierName: string | null;
  notes: string | null;
}

export interface ProductRequest {
  sku: string;
  name: string;
  characterName: string | null;
  franchise: string | null;
  brandId: number;
  categoryId: number;
  lineId: number | null;
  description: string | null;
  mainImageUrl: string | null;
  additionalImageUrls: string[];
  size: string | null;
  purchasePrice: number;
  additionalCosts: number;
  salePrice: number;
  currentStock: number;
  minStock: number;
  status: ProductStatus;
  location: string | null;
  entryDate: string | null;
  supplierId: number | null;
  notes: string | null;
}

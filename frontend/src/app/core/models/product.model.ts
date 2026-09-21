export type ProductStatus = 'AVAILABLE' | 'OUT_OF_STOCK' | 'PREORDER' | 'COMING_SOON' | 'DISCONTINUED';

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  AVAILABLE: 'Disponible',
  OUT_OF_STOCK: 'Agotado',
  PREORDER: 'Preventa',
  COMING_SOON: 'Próximamente',
  DISCONTINUED: 'Descontinuado',
};

export interface ProductImage {
  id: number;
  fileName: string | null;
  isMain: boolean;
  sortOrder: number;
  /** Ruta relativa al servidor (ej. /api/products/images/5/file); anteponer environment.serverOrigin. */
  url: string;
}

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
  images: ProductImage[];
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
  /** Opcional: si no se envía, el backend genera uno (ver ProductService.generateSku). */
  sku?: string | null;
  name: string;
  characterName: string | null;
  franchise: string | null;
  brandId: number;
  categoryId: number;
  lineId: number | null;
  description: string | null;
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

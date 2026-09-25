import { ProductImage, ProductStatus } from './product.model';

/** Espejo de PublicProductResponse (backend): sin costos, ganancia, margen, ubicación ni proveedor. */
export interface PublicProduct {
  id: number;
  sku: string;
  name: string;
  characterName: string | null;
  franchise: string | null;
  brandName: string;
  categoryName: string;
  lineName: string | null;
  description: string | null;
  mainImageUrl: string | null;
  images: ProductImage[];
  size: string | null;
  salePrice: number;
  inStock: boolean;
  /** true si está disponible pero por debajo/igual al stock mínimo — nunca el número real. */
  lowStock: boolean;
  status: ProductStatus;
}

export interface CatalogFilterOption {
  id: number;
  name: string;
}

export interface StoreInfo {
  storeName: string;
  /** null si el admin no configuró STORE_WHATSAPP en Configuración. */
  whatsapp: string | null;
  /** Ruta relativa al backend (ej. /api/catalog/banner/file); null si el admin no subió un banner — antéponer resolveImageUrl(). */
  bannerUrl: string | null;
  /** Ruta relativa al backend (ej. /api/catalog/announcement/file); null si el admin no subió una imagen para el popup de bienvenida. */
  announcementImageUrl: string | null;
}

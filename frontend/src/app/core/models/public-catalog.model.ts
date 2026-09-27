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
  /** Stock real disponible — tope de cantidad al agregar al carrito (ver catalog-product-detail/cart-page). */
  availableQuantity: number;
  status: ProductStatus;
  /** Ficha técnica (Fase 41) — todos opcionales, se muestran en el detalle solo si tienen dato. */
  material: string | null;
  hasArticulations: boolean | null;
  includedAccessories: string | null;
  packagingMaterial: string | null;
  originCountry: string | null;
  releaseDate: string | null;
  packagedWeightGrams: number | null;
  /** Solo se resuelve en el detalle público (findProductById) — siempre null en el listado/grilla. */
  preorderInfo: PublicPreorderInfo | null;
}

/**
 * Barra de progreso/cuenta regresiva de una campaña de preventa activa (Fase 44).
 * `minDepositAmount` (agregado después) sí se expone a propósito — antes el visitante
 * no tenía forma de saber cuánto cuesta separar sin escribir por WhatsApp.
 */
export interface PublicPreorderInfo {
  availableSlots: number;
  totalQuantity: number;
  limitDate: string | null;
  estimatedArrivalDate: string | null;
  minDepositAmount: number;
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
  /** Monto mínimo (S/) para envío gratis, mostrado como banner en el catálogo — null desactiva el banner. */
  freeShippingThreshold: number | null;
  /** Measurement ID de Google Analytics 4 (ej. "G-XXXXXXX"); null desactiva el tracking. */
  googleAnalyticsId: string | null;
  /** ID del Meta Pixel; null desactiva el tracking. */
  metaPixelId: string | null;
}

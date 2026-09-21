export interface CartLine {
  productId: number;
  sku: string;
  name: string;
  mainImageUrl: string | null;
  unitPrice: number;
  quantity: number;
}

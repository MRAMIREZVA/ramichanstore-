export interface CartLine {
  productId: number;
  sku: string;
  name: string;
  mainImageUrl: string | null;
  unitPrice: number;
  quantity: number;
  /** Snapshot del stock disponible al momento de agregar — tope de cantidad en el carrito (ver CartService). */
  availableQuantity: number;
  /**
   * true si el producto está en estado PREORDER. El carrito SÍ permite mezclar
   * productos en stock y en preventa (antes se bloqueaba, ver historial) — el
   * checkout (`checkout-page.submit()`) separa las líneas en 2 pedidos web
   * homogéneos antes de enviarlos, porque el backend sigue sin aceptar un solo
   * pedido mixto (una preventa se resuelve contra cupos de campaña, no stock).
   */
  isPreorder: boolean;
}

export interface CartLine {
  productId: number;
  sku: string;
  name: string;
  mainImageUrl: string | null;
  unitPrice: number;
  quantity: number;
  /** true si el producto está en estado PREORDER — ver CartService.add(), no se puede mezclar con productos en stock en el mismo carrito. */
  isPreorder: boolean;
}

export type AddToCartResult = { ok: true } | { ok: false; reason: 'MIXED_TYPES'; cartHasPreorder: boolean };

export function mixedCartMessage(cartHasPreorder: boolean): string {
  return cartHasPreorder
    ? 'Tu carrito ya tiene una preventa — vacíalo o complétalo antes de agregar productos en stock.'
    : 'Tu carrito ya tiene productos en stock — vacíalo o complétalo antes de agregar una preventa.';
}

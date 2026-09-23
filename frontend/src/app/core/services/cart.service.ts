import { Injectable, computed, signal } from '@angular/core';
import { AddToCartResult, CartLine } from '../models/cart.model';
import { PublicProduct } from '../models/public-catalog.model';

const STORAGE_KEY = 'ramichan_cart_v1';

/**
 * Carrito del catálogo público (sin login, Fase 18) — conveniencia por
 * visitante, persistida en localStorage de este navegador. No es una fuente
 * de verdad de precios: el backend siempre vuelve a tomar el precio real del
 * producto al recibir el pedido (ver OrderRequestService.submit).
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  readonly lines = signal<CartLine[]>(loadFromStorage());

  readonly totalItems = computed(() => this.lines().reduce((sum, l) => sum + l.quantity, 0));
  readonly totalAmount = computed(() => this.lines().reduce((sum, l) => sum + l.unitPrice * l.quantity, 0));

  /**
   * No se permite mezclar productos en preventa (status PREORDER) con productos en
   * stock en el mismo carrito: son dos flujos de cumplimiento distintos (una preventa
   * se reserva contra cupos de una campaña, un producto en stock se vende directo) y
   * un solo pedido web no puede resolverse mitad-venta mitad-reserva. Se bloquea acá,
   * en el momento de agregar, en vez de permitir el carrito mixto y tener que dividir
   * el pedido después.
   */
  add(product: PublicProduct, quantity = 1): AddToCartResult {
    const current = this.lines();
    const existing = current.find((l) => l.productId === product.id);
    if (existing) {
      this.updateQuantity(product.id, existing.quantity + quantity);
      return { ok: true };
    }

    const isPreorder = product.status === 'PREORDER';
    const cartHasPreorder = current.some((l) => l.isPreorder);
    const cartHasStock = current.some((l) => !l.isPreorder);
    if ((isPreorder && cartHasStock) || (!isPreorder && cartHasPreorder)) {
      return { ok: false, reason: 'MIXED_TYPES', cartHasPreorder };
    }

    this.set([
      ...current,
      {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        mainImageUrl: product.mainImageUrl,
        unitPrice: product.salePrice,
        quantity,
        isPreorder,
      },
    ]);
    return { ok: true };
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity <= 0) {
      this.remove(productId);
      return;
    }
    this.set(this.lines().map((l) => (l.productId === productId ? { ...l, quantity } : l)));
  }

  remove(productId: number): void {
    this.set(this.lines().filter((l) => l.productId !== productId));
  }

  clear(): void {
    this.set([]);
  }

  private set(lines: CartLine[]): void {
    this.lines.set(lines);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // modo incógnito / storage bloqueado: el carrito solo vive en memoria para esta sesión de pestaña.
    }
  }
}

function loadFromStorage(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

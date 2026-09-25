import { Injectable, computed, signal } from '@angular/core';
import { CartLine } from '../models/cart.model';
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
   * El carrito permite mezclar productos en stock y en preventa — el checkout
   * es quien separa las líneas en 2 pedidos web homogéneos al enviar (ver
   * checkout-page.submit()), no el carrito en el momento de agregar.
   */
  add(product: PublicProduct, quantity = 1): void {
    const current = this.lines();
    const existing = current.find((l) => l.productId === product.id);
    if (existing) {
      this.updateQuantity(product.id, existing.quantity + quantity);
      return;
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
        isPreorder: product.status === 'PREORDER',
      },
    ]);
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

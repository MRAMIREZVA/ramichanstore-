import { Injectable, computed, signal } from '@angular/core';
import { PublicProduct } from '../models/public-catalog.model';

export interface WishlistItem {
  productId: number;
  sku: string;
  name: string;
  mainImageUrl: string | null;
  salePrice: number;
}

const STORAGE_KEY = 'ramichan_wishlist_v1';

/**
 * Favoritos del catálogo público (Fase 44) — sin cuenta, igual criterio que
 * CartService: conveniencia por visitante, persistida en localStorage de este
 * navegador, nunca fuente de verdad de precio (solo un snapshot para mostrar
 * la tarjeta en /catalogo/favoritos sin tener que re-consultar cada producto).
 */
@Injectable({ providedIn: 'root' })
export class WishlistService {
  readonly items = signal<WishlistItem[]>(loadFromStorage());

  readonly totalItems = computed(() => this.items().length);

  isWishlisted(productId: number): boolean {
    return this.items().some((i) => i.productId === productId);
  }

  toggle(product: PublicProduct): void {
    if (this.isWishlisted(product.id)) {
      this.remove(product.id);
    } else {
      this.set([
        ...this.items(),
        { productId: product.id, sku: product.sku, name: product.name, mainImageUrl: product.mainImageUrl, salePrice: product.salePrice },
      ]);
    }
  }

  remove(productId: number): void {
    this.set(this.items().filter((i) => i.productId !== productId));
  }

  clear(): void {
    this.set([]);
  }

  private set(items: WishlistItem[]): void {
    this.items.set(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // modo incógnito / storage bloqueado: los favoritos solo viven en memoria para esta pestaña.
    }
  }
}

function loadFromStorage(): WishlistItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WishlistItem[]) : [];
  } catch {
    return [];
  }
}

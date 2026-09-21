import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CartLine } from '../../../core/models/cart.model';
import { CartService } from '../../../core/services/cart.service';
import { resolveImageUrl } from '../../../core/utils/image-url';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './cart-page.html',
  styleUrl: './cart-page.scss',
})
export class CartPage {
  private readonly router = inject(Router);
  readonly cartService = inject(CartService);

  readonly resolveImageUrl = resolveImageUrl;
  readonly lines = this.cartService.lines;
  readonly totalAmount = this.cartService.totalAmount;

  increment(line: CartLine): void {
    this.cartService.updateQuantity(line.productId, line.quantity + 1);
  }

  decrement(line: CartLine): void {
    this.cartService.updateQuantity(line.productId, line.quantity - 1);
  }

  remove(line: CartLine): void {
    this.cartService.remove(line.productId);
  }

  checkout(): void {
    this.router.navigate(['/catalogo/checkout']);
  }
}

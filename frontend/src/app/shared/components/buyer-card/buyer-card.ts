import { Component, computed, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { whatsAppLink } from '../../../core/utils/whatsapp';

/**
 * Tarjeta de comprador reutilizada en el detalle de Ventas/Separaciones/Preventas
 * (unificadas bajo "Pedidos" — ver CLAUDE.md sección 9). Mismo botón de WhatsApp
 * que ya usa PortalAccessFormComponent (Fase 13), reutilizando el helper compartido.
 */
@Component({
  selector: 'app-buyer-card',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './buyer-card.html',
  styleUrl: './buyer-card.scss',
})
export class BuyerCardComponent {
  readonly customerName = input.required<string>();
  readonly phone = input<string | null>(null);
  readonly whatsapp = input<string | null>(null);
  /** Mensaje prellenado del chat de WhatsApp (ej. "Hola Juan, sobre tu pedido #123..."). */
  readonly message = input<string>('');

  readonly whatsAppUrl = computed(() => {
    const rawPhone = this.whatsapp() || this.phone();
    if (!rawPhone) return null;
    return whatsAppLink(rawPhone, this.message());
  });
}

import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { DELIVERY_METHOD_LABELS, PAYMENT_METHOD_LABELS } from '../../../core/models/sale.model';
import { OrderRequest } from '../../../core/models/order-request.model';
import { PublicCatalogService } from '../../../core/services/public-catalog.service';

export interface OrderReceiptDialogData {
  order: OrderRequest;
}

/**
 * Comprobante de pedido web descargable en PDF (Fase 62, pedido explícito del dueño: "en la
 * parte del carrito al hacer el pedido o pagar debe descargar el pdf con el pedido como
 * comprobante"). Hermano de `SaleReceiptDialogComponent` (Fase 61, panel admin) pero con su
 * propio componente en vez de reutilizar aquel: los datos de origen son distintos
 * (`OrderRequest`, no `Sale` — acá SÍ vive la dirección/agencia de entrega, allá no) y esta
 * pantalla vive en el catálogo público (tema oscuro "Vitrina", Fase 49) en vez del admin, así
 * que el recibo necesita forzar fondo claro explícitamente en vez de heredarlo.
 *
 * Mismo patrón "Imprimir -> Guardar como PDF" ya probado (Fase 42/43/61): sin librería nueva,
 * reutiliza la misma regla global de impresión en styles.scss vía la clase `.print-receipt-area`.
 *
 * Es un comprobante de que el PEDIDO se recibió, no de que se pagó ni un comprobante
 * electrónico SUNAT — el pie lo aclara explícitamente (un pedido web queda pendiente de
 * revisión del admin, ver OrderRequestStatus).
 */
@Component({
  selector: 'app-order-receipt-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './order-receipt-dialog.html',
  styleUrl: './order-receipt-dialog.scss',
})
export class OrderReceiptDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<OrderReceiptDialogComponent>);
  private readonly catalogService = inject(PublicCatalogService);
  readonly data = inject<OrderReceiptDialogData>(MAT_DIALOG_DATA);

  readonly paymentMethodLabels = PAYMENT_METHOD_LABELS;
  readonly deliveryMethodLabels = DELIVERY_METHOD_LABELS;

  readonly storeName = signal('RamichanStore');
  readonly storeWhatsapp = signal<string | null>(null);

  constructor() {
    this.catalogService.getStoreInfo().subscribe({
      next: (res) => {
        this.storeName.set(res.data.storeName);
        this.storeWhatsapp.set(res.data.whatsapp);
      },
      error: () => {
        // Sin conexión momentánea, etc. -- el comprobante se sigue pudiendo imprimir con el
        // nombre por defecto, no tiene sentido bloquear la impresión por esto.
      },
    });
  }

  /** Solo la fecha (sin hora) de `createdAt` — evita cargar un pipe nuevo solo para esto. */
  orderDate(): string {
    return this.data.order.createdAt.slice(0, 10);
  }

  /** Distrito, provincia y departamento en una sola línea, omitiendo los que falten (ninguno es
   *  obligatorio salvo cuando el tipo de entrega los exige — ver checkout-page). */
  locationLine(): string {
    const { guestDistrict, guestProvince, guestDepartment } = this.data.order;
    return [guestDistrict, guestProvince, guestDepartment].filter((v): v is string => !!v).join(', ');
  }

  print(): void {
    window.print();
  }

  close(): void {
    this.dialogRef.close();
  }
}

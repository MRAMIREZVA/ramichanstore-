import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { DELIVERY_METHOD_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, Sale, SalePayment } from '../../../core/models/sale.model';
import { PublicCatalogService } from '../../../core/services/public-catalog.service';

export interface SaleReceiptDialogData {
  sale: Sale;
  /** Ledger de abonos ya cargado por sale-detail (más fresco que `sale.payments`, que puede
   *  no reflejar un abono recién editado dentro del mismo diálogo antes de imprimir). Vacío
   *  si type=VENTA, donde no aplica. */
  payments: SalePayment[];
}

/**
 * Nota de venta/separación descargable en PDF (Fase 61, pedido explícito del dueño para poder
 * enviarla a sus clientes por WhatsApp). Mismo patrón "Imprimir -> Guardar como PDF" ya probado
 * en PrintLabelDialogComponent (Fase 42) y en el Libro de Reclamaciones (Fase 43): sin librería
 * nueva, todo el diseño vive en CSS bajo `@media print` (ver styles.scss, que reutiliza la misma
 * regla global ya endurecida contra los 4 bugs de impresión documentados en la Fase 42).
 *
 * Es un documento INFORMATIVO, no un comprobante de pago electrónico SUNAT (RamichanStore no
 * emite boletas/facturas) -- el aviso queda explícito en el pie para no generar confusión.
 */
@Component({
  selector: 'app-sale-receipt-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './sale-receipt-dialog.html',
  styleUrl: './sale-receipt-dialog.scss',
})
export class SaleReceiptDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<SaleReceiptDialogComponent>);
  private readonly catalogService = inject(PublicCatalogService);
  readonly data = inject<SaleReceiptDialogData>(MAT_DIALOG_DATA);

  readonly paymentMethodLabels = PAYMENT_METHOD_LABELS;
  readonly paymentStatusLabels = PAYMENT_STATUS_LABELS;
  readonly deliveryMethodLabels = DELIVERY_METHOD_LABELS;

  // GET /api/catalog/store-info es público -- se reutiliza tal cual desde el admin (mismo
  // criterio que el resto del proyecto: nunca duplicar un endpoint que ya existe).
  readonly storeName = signal('RamichanStore');
  readonly storeWhatsapp = signal<string | null>(null);

  constructor() {
    this.catalogService.getStoreInfo().subscribe({
      next: (res) => {
        this.storeName.set(res.data.storeName);
        this.storeWhatsapp.set(res.data.whatsapp);
      },
      error: () => {
        // Sin conexión momentánea, etc. -- el recibo se sigue pudiendo imprimir con el
        // nombre por defecto, no tiene sentido bloquear la impresión por esto.
      },
    });
  }

  print(): void {
    window.print();
  }

  close(): void {
    this.dialogRef.close();
  }
}

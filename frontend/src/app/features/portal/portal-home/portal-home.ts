import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';
import { DeliveryStatus, PurchaseType } from '../../../core/models/delivery.model';
import { PAYMENT_STATUS_LABELS, PaymentStatus, Sale } from '../../../core/models/sale.model';
import { PortalReservation } from '../../../core/models/portal.model';
import { PortalDataService } from '../../../core/services/portal-data.service';
import { buildDeliveryLookup, deliveryLabelFor, deliveryStatusAttrFor, purchaseKey } from '../../../core/utils/delivery-label';
import { resolveImageUrl } from '../../../core/utils/image-url';
import { PortalSaleDetailComponent, PortalSaleDetailData } from '../portal-sale-detail/portal-sale-detail';

const RESERVATION_STATUS_LABELS: Record<string, string> = {
  COMING_SOON: 'Próximamente',
  ACTIVE: 'Preventa activa',
  SOLD_OUT: 'Agotada',
  IN_TRANSIT: 'En camino',
  RECEIVED: 'Recibida',
  DELIVERED: 'Entregada',
  CANCELLED: 'Cancelada',
};

/** Traer hasta esta cantidad de ventas/separaciones del cliente y paginar del lado del cliente al unirlas — a esta escala (una tienda, no un marketplace) es irrelevante en la práctica, ver CLAUDE.md. */
const FETCH_SIZE = 200;

/** Fila unificada de "Mis compras" — antes esta pestaña solo mostraba Ventas y un cliente cuya única compra fue una Separación (reserva de un producto ya en stock pagado en abonos) no veía nada; ver CLAUDE.md Fase 17. */
interface PortalPurchaseRow {
  type: PurchaseType;
  id: number;
  date: string;
  summary: string;
  total: number;
  paymentStatus: PaymentStatus;
  deliveryLabel: string;
  deliveryStatusAttr: DeliveryStatus | 'NONE';
  sale: Sale | null;
}

@Component({
  selector: 'app-portal-home',
  standalone: true,
  imports: [
    MatTabsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './portal-home.html',
  styleUrl: './portal-home.scss',
})
export class PortalHome implements OnInit {
  private readonly portalDataService = inject(PortalDataService);
  private readonly dialog = inject(MatDialog);

  readonly resolveImageUrl = resolveImageUrl;
  readonly statusLabels = PAYMENT_STATUS_LABELS;
  readonly reservationStatusLabels = RESERVATION_STATUS_LABELS;
  readonly purchaseColumns = ['date', 'type', 'summary', 'total', 'status', 'delivery', 'actions'];

  readonly loadingBalance = signal(true);
  readonly pointsBalance = signal(0);

  readonly loadingPurchases = signal(true);
  readonly purchases = signal<PortalPurchaseRow[]>([]);
  readonly totalPurchases = signal(0);
  private allPurchases: PortalPurchaseRow[] = [];
  page = 0;
  pageSize = 10;

  readonly loadingReservations = signal(true);
  readonly reservations = signal<PortalReservation[]>([]);

  ngOnInit(): void {
    this.portalDataService.myLoyaltyBalance().subscribe({
      next: (res) => {
        this.pointsBalance.set(res.data.balance);
        this.loadingBalance.set(false);
      },
      error: () => this.loadingBalance.set(false),
    });

    this.loadPurchases();

    this.portalDataService.myReservations().subscribe({
      next: (res) => {
        this.reservations.set(res.data);
        this.loadingReservations.set(false);
      },
      error: () => this.loadingReservations.set(false),
    });
  }

  loadPurchases(): void {
    this.loadingPurchases.set(true);
    forkJoin({
      sales: this.portalDataService.mySales(0, FETCH_SIZE),
      separations: this.portalDataService.mySeparations(0, FETCH_SIZE),
      deliveries: this.portalDataService.myDeliveries(),
    }).subscribe({
      next: ({ sales, separations, deliveries }) => {
        const deliveryLookup = buildDeliveryLookup(deliveries.data);

        const saleRows: PortalPurchaseRow[] = sales.data.content.map((s) => {
          const delivery = deliveryLookup.get(purchaseKey('VENTA', s.id));
          return {
            type: 'VENTA',
            id: s.id,
            date: s.saleDate,
            summary: `${s.items.length} producto(s)`,
            total: s.total,
            paymentStatus: s.paymentStatus,
            deliveryLabel: deliveryLabelFor(delivery, s.paymentStatus),
            deliveryStatusAttr: deliveryStatusAttrFor(delivery, s.paymentStatus),
            sale: s,
          };
        });
        const separationRows: PortalPurchaseRow[] = separations.data.content.map((s) => {
          const delivery = deliveryLookup.get(purchaseKey('SEPARACION', s.id));
          return {
            type: 'SEPARACION',
            id: s.id,
            date: s.separationDate,
            summary: s.productName,
            total: s.totalPrice,
            paymentStatus: s.status,
            deliveryLabel: deliveryLabelFor(delivery, s.status),
            deliveryStatusAttr: deliveryStatusAttrFor(delivery, s.status),
            sale: null,
          };
        });

        this.allPurchases = [...saleRows, ...separationRows].sort((a, b) => b.date.localeCompare(a.date));
        this.totalPurchases.set(this.allPurchases.length);
        this.page = 0;
        this.applyPage();
        this.loadingPurchases.set(false);
      },
      error: () => this.loadingPurchases.set(false),
    });
  }

  private applyPage(): void {
    const start = this.page * this.pageSize;
    this.purchases.set(this.allPurchases.slice(start, start + this.pageSize));
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex;
    this.pageSize = event.pageSize;
    this.applyPage();
  }

  statusLabel(status: PaymentStatus): string {
    return this.statusLabels[status];
  }

  reservationStatusLabel(status: string): string {
    return this.reservationStatusLabels[status] ?? status;
  }

  viewPurchase(row: PortalPurchaseRow): void {
    if (!row.sale) return;
    const data: PortalSaleDetailData = {
      sale: row.sale,
      deliveryLabel: row.deliveryLabel,
      deliveryStatusAttr: row.deliveryStatusAttr,
    };
    this.dialog.open(PortalSaleDetailComponent, { data, width: '600px', maxWidth: '95vw' });
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  CUSTOMER_STATUS_LABELS,
  Customer,
  CustomerStatus,
  DOCUMENT_TYPE_LABELS,
  DocumentType,
} from '../../../core/models/customer.model';
import { DeliveryStatus } from '../../../core/models/delivery.model';
import { CustomerReservation, PREORDER_STATUS_LABELS } from '../../../core/models/preorder.model';
import { PAYMENT_STATUS_LABELS, PaymentStatus } from '../../../core/models/sale.model';
import { CustomerService } from '../../../core/services/customer.service';
import { DeliveryService } from '../../../core/services/delivery.service';
import { LoyaltyService } from '../../../core/services/loyalty.service';
import { PreorderService } from '../../../core/services/preorder.service';
import { SaleService } from '../../../core/services/sale.service';
import { SeparationService } from '../../../core/services/separation.service';
import { buildDeliveryLookup, deliveryLabelFor, deliveryStatusAttrFor, purchaseKey } from '../../../core/utils/delivery-label';
import { resolveImageUrl } from '../../../core/utils/image-url';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { PortalAccessFormComponent, PortalAccessFormData } from '../portal-access-form/portal-access-form';

export interface CustomerDetailData {
  customer: Customer;
}

/** Fila unificada de "Compras" — una venta o una separación se ven igual acá (fecha/monto/estado de pago/entrega), solo cambia el tipo. */
export interface PurchaseRow {
  type: 'VENTA' | 'SEPARACION';
  id: number;
  date: string;
  summary: string;
  total: number;
  paymentStatus: PaymentStatus;
  deliveryLabel: string;
  deliveryStatusAttr: DeliveryStatus | 'NONE';
}

const RECENT_LIMIT = 5;

/**
 * Ficha del cliente: datos + acceso al portal de solo lectura + últimas compras
 * (ventas Y separaciones unificadas — antes solo mostraba ventas, y un cliente
 * cuya única compra fue una separación aparecía sin nada) y reservas de
 * preventa reales, con botones para ver el historial completo en Pedidos.
 */
@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule],
  templateUrl: './customer-detail.html',
  styleUrl: './customer-detail.scss',
})
export class CustomerDetailComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<CustomerDetailComponent>);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly customerService = inject(CustomerService);
  private readonly saleService = inject(SaleService);
  private readonly separationService = inject(SeparationService);
  private readonly deliveryService = inject(DeliveryService);
  private readonly preorderService = inject(PreorderService);
  private readonly loyaltyService = inject(LoyaltyService);
  private readonly snackBar = inject(MatSnackBar);
  readonly data = inject<CustomerDetailData>(MAT_DIALOG_DATA);

  readonly customer = signal(this.data.customer);
  readonly changed = signal(false);

  readonly statusLabels = CUSTOMER_STATUS_LABELS;
  readonly documentTypeLabels = DOCUMENT_TYPE_LABELS;
  readonly paymentStatusLabels = PAYMENT_STATUS_LABELS;
  readonly preorderStatusLabels = PREORDER_STATUS_LABELS;
  readonly resolveImageUrl = resolveImageUrl;

  readonly loadingPurchases = signal(true);
  readonly recentPurchases = signal<PurchaseRow[]>([]);
  readonly totalPurchases = signal(0);

  readonly loadingReservations = signal(true);
  readonly reservations = signal<CustomerReservation[]>([]);

  readonly loadingPoints = signal(true);
  readonly pointsBalance = signal(0);

  ngOnInit(): void {
    const customerId = this.customer().id;

    this.loyaltyService.getBalance(customerId).subscribe({
      next: (res) => {
        this.pointsBalance.set(res.data.balance);
        this.loadingPoints.set(false);
      },
      error: () => this.loadingPoints.set(false),
    });

    forkJoin({
      sales: this.saleService.search({ customerId, size: RECENT_LIMIT, sort: 'saleDate,desc' }),
      separations: this.separationService.search({ customerId, size: RECENT_LIMIT }),
      deliveries: this.deliveryService.search({ customerId, size: 50 }),
    }).subscribe({
      next: ({ sales, separations, deliveries }) => {
        const deliveryLookup = buildDeliveryLookup(deliveries.data.content);

        const saleRows: PurchaseRow[] = sales.data.content.map((s) => {
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
          };
        });
        const separationRows: PurchaseRow[] = separations.data.content.map((s) => {
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
          };
        });

        this.recentPurchases.set(
          [...saleRows, ...separationRows].sort((a, b) => b.date.localeCompare(a.date)).slice(0, RECENT_LIMIT),
        );
        this.totalPurchases.set(sales.data.totalElements + separations.data.totalElements);
        this.loadingPurchases.set(false);
      },
      error: () => this.loadingPurchases.set(false),
    });

    this.preorderService.listReservationsByCustomer(customerId).subscribe({
      next: (res) => {
        this.reservations.set(res.data.slice(0, RECENT_LIMIT));
        this.loadingReservations.set(false);
      },
      error: () => this.loadingReservations.set(false),
    });
  }

  statusLabel(status: CustomerStatus): string {
    return this.statusLabels[status];
  }

  documentTypeLabel(type: DocumentType | null): string {
    return type ? this.documentTypeLabels[type] : 'Sin especificar';
  }

  paymentStatusLabel(status: PaymentStatus): string {
    return this.paymentStatusLabels[status];
  }

  viewAllPurchases(): void {
    this.dialogRef.close(this.changed());
    this.router.navigate(['/pedidos'], {
      queryParams: { tab: 0, customerId: this.customer().id, customerName: this.customer().fullName },
    });
  }

  viewAllReservations(): void {
    this.dialogRef.close(this.changed());
    this.router.navigate(['/pedidos'], { queryParams: { tab: 2, customerName: this.customer().fullName } });
  }

  viewPointsHistory(): void {
    this.dialogRef.close(this.changed());
    this.router.navigate(['/puntos'], {
      queryParams: {
        customerId: this.customer().id,
        customerName: this.customer().fullName,
        customerPhone: this.customer().phone,
      },
    });
  }

  openEnablePortalAccess(): void {
    this.openPortalAccessForm(false);
  }

  openResetPortalPassword(): void {
    this.openPortalAccessForm(true);
  }

  private openPortalAccessForm(resetOnly: boolean): void {
    const data: PortalAccessFormData = { customer: this.customer(), resetOnly };
    const ref = this.dialog.open<PortalAccessFormComponent, PortalAccessFormData, boolean>(PortalAccessFormComponent, {
      data,
      width: '460px',
      autoFocus: false,
    });
    ref.afterClosed().subscribe((success) => {
      if (!success) return;
      this.changed.set(true);
      if (!resetOnly) {
        this.customerService.findById(this.customer().id).subscribe((res) => this.customer.set(res.data));
      }
    });
  }

  confirmDisablePortalAccess(): void {
    const data: ConfirmDialogData = {
      title: 'Deshabilitar acceso al portal',
      message: `¿Seguro que deseas quitarle el acceso al portal a "${this.customer().fullName}"? Podrás volver a habilitarlo cuando quieras.`,
      confirmLabel: 'Deshabilitar',
      destructive: true,
    };
    const ref = this.dialog.open(ConfirmDialog, { data, width: '420px' });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.customerService.disablePortalAccess(this.customer().id).subscribe({
        next: (res) => {
          this.changed.set(true);
          this.customer.set(res.data);
          this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
        },
      });
    });
  }

  close(): void {
    this.dialogRef.close(this.changed());
  }
}

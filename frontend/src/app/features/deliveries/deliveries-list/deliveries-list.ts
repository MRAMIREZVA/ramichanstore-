import { KeyValuePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DELIVERY_STATUS_LABELS, Delivery, DeliveryStatus } from '../../../core/models/delivery.model';
import { DELIVERY_METHOD_LABELS, DeliveryMethod } from '../../../core/models/sale.model';
import { DeliveryFilters, DeliveryService } from '../../../core/services/delivery.service';
import { DeliveryFormComponent, DeliveryFormData } from '../delivery-form/delivery-form';

@Component({
  selector: 'app-deliveries-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    KeyValuePipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './deliveries-list.html',
  styleUrl: './deliveries-list.scss',
})
export class DeliveriesList implements OnInit {
  private readonly deliveryService = inject(DeliveryService);
  private readonly dialog = inject(MatDialog);

  readonly statusLabels = DELIVERY_STATUS_LABELS;
  readonly methodLabels = DELIVERY_METHOD_LABELS;
  readonly displayedColumns = ['customer', 'items', 'type', 'destination', 'scheduledDate', 'status', 'actions'];

  readonly loading = signal(true);
  readonly deliveries = signal<Delivery[]>([]);
  readonly totalElements = signal(0);

  readonly statusControl = new FormControl<DeliveryStatus | null>(null);

  page = 0;
  pageSize = 20;

  ngOnInit(): void {
    this.statusControl.valueChanges.subscribe(() => {
      this.page = 0;
      this.load();
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const filters: DeliveryFilters = { status: this.statusControl.value, page: this.page, size: this.pageSize };
    this.deliveryService.search(filters).subscribe({
      next: (res) => {
        this.deliveries.set(res.data.content);
        this.totalElements.set(res.data.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  statusLabel(status: DeliveryStatus): string {
    return this.statusLabels[status];
  }

  methodLabel(method: DeliveryMethod): string {
    return this.methodLabels[method];
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  openCreate(): void {
    this.openForm(null);
  }

  openEdit(delivery: Delivery): void {
    this.openForm(delivery);
  }

  private openForm(delivery: Delivery | null): void {
    const data: DeliveryFormData = { delivery };
    const ref = this.dialog.open<DeliveryFormComponent, DeliveryFormData, boolean>(DeliveryFormComponent, {
      data,
      width: '720px',
      maxWidth: '95vw',
      autoFocus: false,
    });
    ref.afterClosed().subscribe((changed) => {
      if (changed) {
        this.load();
      }
    });
  }
}

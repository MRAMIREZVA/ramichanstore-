import { KeyValuePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import {
  SHIPMENT_STATUS_LABELS,
  SHIPMENT_TYPE_LABELS,
  Shipment,
  ShipmentStatus,
  ShipmentType,
} from '../../../core/models/shipment.model';
import { ShipmentFilters, ShipmentService } from '../../../core/services/shipment.service';
import { toIsoDate } from '../../../core/utils/date';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { ShipmentFormComponent, ShipmentFormData } from '../shipment-form/shipment-form';

@Component({
  selector: 'app-shipments-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    KeyValuePipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './shipments-list.html',
  styleUrl: './shipments-list.scss',
})
export class ShipmentsList implements OnInit {
  private readonly shipmentService = inject(ShipmentService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly statusLabels = SHIPMENT_STATUS_LABELS;
  readonly typeLabels = SHIPMENT_TYPE_LABELS;
  readonly displayedColumns = ['code', 'holder', 'type', 'dates', 'finalCost', 'status', 'actions'];

  readonly loading = signal(true);
  readonly shipments = signal<Shipment[]>([]);
  readonly totalElements = signal(0);

  readonly searchControl = new FormControl('');
  readonly statusControl = new FormControl<ShipmentStatus | null>(null);
  readonly typeControl = new FormControl<ShipmentType | null>(null);
  readonly fromControl = new FormControl<Date | null>(null);
  readonly toControl = new FormControl<Date | null>(null);

  page = 0;
  pageSize = 20;

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(debounceTime(350), distinctUntilChanged()).subscribe(() => {
      this.page = 0;
      this.load();
    });
    this.statusControl.valueChanges.subscribe(() => {
      this.page = 0;
      this.load();
    });
    this.typeControl.valueChanges.subscribe(() => {
      this.page = 0;
      this.load();
    });
    this.fromControl.valueChanges.subscribe(() => {
      this.page = 0;
      this.load();
    });
    this.toControl.valueChanges.subscribe(() => {
      this.page = 0;
      this.load();
    });

    this.load();
  }

  load(): void {
    this.loading.set(true);
    const filters: ShipmentFilters = {
      search: this.searchControl.value || undefined,
      status: this.statusControl.value,
      type: this.typeControl.value,
      from: toIsoDate(this.fromControl.value),
      to: toIsoDate(this.toControl.value),
      page: this.page,
      size: this.pageSize,
    };
    this.shipmentService.search(filters).subscribe({
      next: (res) => {
        this.shipments.set(res.data.content);
        this.totalElements.set(res.data.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  statusLabel(status: ShipmentStatus): string {
    return this.statusLabels[status];
  }

  typeLabel(type: ShipmentType): string {
    return this.typeLabels[type];
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  openCreate(): void {
    this.openForm(null);
  }

  openEdit(shipment: Shipment): void {
    this.openForm(shipment);
  }

  private openForm(shipment: Shipment | null): void {
    const data: ShipmentFormData = { shipment };
    const ref = this.dialog.open<ShipmentFormComponent, ShipmentFormData, boolean>(ShipmentFormComponent, {
      data,
      width: '1160px',
      maxWidth: '95vw',
      autoFocus: false,
    });
    ref.afterClosed().subscribe((changed) => {
      if (changed) {
        this.load();
      }
    });
  }

  confirmDelete(shipment: Shipment): void {
    const data: ConfirmDialogData = {
      title: 'Eliminar embarque',
      message: `¿Eliminar el embarque "${shipment.code}"?`,
      confirmLabel: 'Eliminar',
      destructive: true,
    };
    const ref = this.dialog.open(ConfirmDialog, { data, width: '420px' });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.shipmentService.delete(shipment.id).subscribe({
        next: (res) => {
          this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
          this.load();
        },
      });
    });
  }
}

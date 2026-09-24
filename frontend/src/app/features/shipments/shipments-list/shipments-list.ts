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
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import {
  SHIPMENT_STATUS_LABELS,
  Shipment,
  ShipmentStatus,
  ShipmentTypeOption,
} from '../../../core/models/shipment.model';
import { ShipmentFilters, ShipmentService } from '../../../core/services/shipment.service';
import { ShipmentTypeOptionService } from '../../../core/services/shipment-type-option.service';
import { toIsoDate } from '../../../core/utils/date';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { ShipmentFormComponent, ShipmentFormData } from '../shipment-form/shipment-form';

/**
 * Agrupación de los 9 `ShipmentStatus` en 4 "carriles" visuales para la línea de tiempo de la tarjeta.
 * Copia EXACTA de los grupos ya establecidos en los selectores `.status-chip[data-status=...]`
 * de este mismo componente (Fase 19) — no es un orden cronológico inventado, es el mismo criterio
 * de color que el admin ya conoce (verde=positivo, ámbar=en curso, morado=aún no sale, rojo=atención).
 */
type StatusTier = 'pending' | 'transit' | 'attention' | 'done';

const STATUS_TIER: Record<ShipmentStatus, StatusTier> = {
  PENDIENTE_ENVIO: 'pending',
  EN_COTIZACION_ENVIO: 'pending',
  PENDIENTE_PAGO: 'pending',
  EN_CAMINO: 'transit',
  LLEGO_A_SERPOST: 'transit',
  OBSERVADO_ADUANAS: 'attention',
  LISTO_PARA_DELIVERY: 'done',
  EN_TIENDA: 'done',
  LLEGO_A_PERU: 'done',
};

const TIER_PROGRESS: Record<StatusTier, number> = {
  pending: 15,
  transit: 55,
  attention: 55,
  done: 100,
};

@Component({
  selector: 'app-shipments-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    KeyValuePipe,
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
  private readonly shipmentTypeOptionService = inject(ShipmentTypeOptionService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly statusLabels = SHIPMENT_STATUS_LABELS;
  readonly types = signal<ShipmentTypeOption[]>([]);

  readonly loading = signal(true);
  readonly shipments = signal<Shipment[]>([]);
  readonly totalElements = signal(0);

  readonly searchControl = new FormControl('');
  readonly statusControl = new FormControl<ShipmentStatus | null>(null);
  readonly typeControl = new FormControl<number | null>(null);
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

    this.shipmentTypeOptionService.findAll().subscribe((res) => this.types.set(res.data));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const filters: ShipmentFilters = {
      search: this.searchControl.value || undefined,
      status: this.statusControl.value,
      typeId: this.typeControl.value,
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

  statusTier(status: ShipmentStatus): StatusTier {
    return STATUS_TIER[status];
  }

  timelineProgress(status: ShipmentStatus): number {
    return TIER_PROGRESS[STATUS_TIER[status]];
  }

  /** Ícono del tipo de envío por heurística de texto — la maestra de tipos es texto libre editable (Fase 25). */
  typeIcon(typeName: string): string {
    const n = (typeName || '').toLowerCase();
    if (n.includes('aér') || n.includes('aer') || n.includes('avi')) return 'flight';
    if (n.includes('marít') || n.includes('marit') || n.includes('barco')) return 'directions_boat';
    return 'inventory_2';
  }

  /** Ícono del nodo de progreso en la línea de tiempo, según el carril del estado. */
  timelineNodeIcon(status: ShipmentStatus, typeName: string): string {
    const tier = this.statusTier(status);
    if (tier === 'done') return 'check';
    if (tier === 'attention') return 'priority_high';
    return this.typeIcon(typeName);
  }

  /**
   * Formatea una fecha "YYYY-MM-DD" a "DD/MM/YYYY" sin pasar por `Date` —
   * evita el bug de corrimiento de un día documentado en la Fase 24 (nunca `new Date(iso)` para un date-only).
   */
  formatDate(iso: string | null): string {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  /** Texto del extremo "Perú" de la línea de tiempo — varía según si ya llegó, está observado, o solo hay estimado. */
  arrivalLabel(s: Shipment): string {
    const tier = this.statusTier(s.status);
    if (tier === 'done') {
      return s.arrivalDate ? `Llegó ${this.formatDate(s.arrivalDate)}` : 'Llegó';
    }
    if (tier === 'attention') {
      return 'Observado';
    }
    if (s.arrivalDate) return `Llegó ${this.formatDate(s.arrivalDate)}`;
    if (s.possibleArrivalDate) return `Estimado ${this.formatDate(s.possibleArrivalDate)}`;
    return 'Por confirmar';
  }

  /** Peso a mostrar: el final si ya se pesó de vuelta, si no el de las figuras al salir. */
  weightLabel(s: Shipment): string {
    if (s.finalWeight !== null) return `${s.finalWeight} g`;
    if (s.figuresWeight !== null) return `${s.figuresWeight} g`;
    return '—';
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

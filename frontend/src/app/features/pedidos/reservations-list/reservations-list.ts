import { KeyValuePipe, SlicePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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
import { PREORDER_STATUS_LABELS, PreorderReservation, PreorderStatus } from '../../../core/models/preorder.model';
import { PreorderService } from '../../../core/services/preorder.service';
import { toIsoDate } from '../../../core/utils/date';
import { resolveImageUrl } from '../../../core/utils/image-url';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { ReservationDetailComponent, ReservationDetailData } from '../reservation-detail/reservation-detail';

@Component({
  selector: 'app-reservations-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    KeyValuePipe,
    SlicePipe,
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
  templateUrl: './reservations-list.html',
  styleUrl: './reservations-list.scss',
})
export class ReservationsList implements OnInit {
  private readonly preorderService = inject(PreorderService);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly statusLabels = PREORDER_STATUS_LABELS;
  readonly resolveImageUrl = resolveImageUrl;
  readonly displayedColumns = ['date', 'customer', 'product', 'deposit', 'status', 'actions'];

  readonly loading = signal(true);
  readonly reservations = signal<PreorderReservation[]>([]);
  readonly totalElements = signal(0);

  readonly searchControl = new FormControl('');
  readonly statusControl = new FormControl<PreorderStatus | null>(null);
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
    this.fromControl.valueChanges.subscribe(() => {
      this.page = 0;
      this.load();
    });
    this.toControl.valueChanges.subscribe(() => {
      this.page = 0;
      this.load();
    });

    // Pre-filtro por cliente al llegar desde "Ver todas" en la ficha del cliente (customer-detail).
    const customerName = this.route.snapshot.queryParamMap.get('customerName');
    if (customerName) {
      this.searchControl.setValue(customerName, { emitEvent: false });
    }

    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.preorderService
      .searchReservations({
        search: this.searchControl.value || undefined,
        status: this.statusControl.value,
        from: toIsoDate(this.fromControl.value),
        to: toIsoDate(this.toControl.value),
        page: this.page,
        size: this.pageSize,
      })
      .subscribe({
        next: (res) => {
          this.reservations.set(res.data.content);
          this.totalElements.set(res.data.totalElements);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  statusLabel(status: PreorderStatus): string {
    return this.statusLabels[status];
  }

  openDetail(reservation: PreorderReservation): void {
    const data: ReservationDetailData = { reservation };
    this.dialog.open(ReservationDetailComponent, { data, width: '520px', maxWidth: '95vw' });
  }

  cancelReservation(reservation: PreorderReservation): void {
    const data: ConfirmDialogData = {
      title: 'Cancelar reserva',
      message: `¿Cancelar la reserva de "${reservation.customerName}" (${reservation.quantity} unidad(es)) de "${reservation.productName}"? Libera esos cupos.`,
      confirmLabel: 'Cancelar reserva',
      destructive: true,
    };
    const ref = this.dialog.open(ConfirmDialog, { data, width: '420px' });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.preorderService.cancelReservation(reservation.preorderId, reservation.id).subscribe({
        next: (res) => {
          this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
          this.load();
        },
      });
    });
  }
}

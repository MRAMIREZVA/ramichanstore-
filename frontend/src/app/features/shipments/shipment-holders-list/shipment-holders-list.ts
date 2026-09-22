import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ShipmentHolder } from '../../../core/models/shipment.model';
import { ShipmentHolderService } from '../../../core/services/shipment-holder.service';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { ShipmentHolderFormComponent, ShipmentHolderFormData } from '../shipment-holder-form/shipment-holder-form';

@Component({
  selector: 'app-shipment-holders-list',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule, MatDialogModule],
  templateUrl: './shipment-holders-list.html',
  styleUrl: './shipment-holders-list.scss',
})
export class ShipmentHoldersList implements OnInit {
  private readonly shipmentHolderService = inject(ShipmentHolderService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly displayedColumns = ['name', 'zenAccount', 'notes', 'actions'];
  readonly loading = signal(true);
  readonly holders = signal<ShipmentHolder[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.shipmentHolderService.findAll().subscribe({
      next: (res) => {
        this.holders.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreate(): void {
    this.openForm(null);
  }

  openEdit(holder: ShipmentHolder): void {
    this.openForm(holder);
  }

  private openForm(holder: ShipmentHolder | null): void {
    const data: ShipmentHolderFormData = { holder };
    const ref = this.dialog.open(ShipmentHolderFormComponent, { data, width: '460px', autoFocus: false });
    ref.afterClosed().subscribe((request) => {
      if (!request) return;
      const obs = holder
        ? this.shipmentHolderService.update(holder.id, request)
        : this.shipmentHolderService.create(request);
      obs.subscribe({
        next: (res) => {
          this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
          this.load();
        },
      });
    });
  }

  confirmDelete(holder: ShipmentHolder): void {
    const data: ConfirmDialogData = {
      title: 'Eliminar titular',
      message: `¿Eliminar a "${holder.name}"? Si tiene embarques registrados, no se podrá eliminar.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    };
    const ref = this.dialog.open(ConfirmDialog, { data, width: '420px' });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.shipmentHolderService.delete(holder.id).subscribe({
        next: (res) => {
          this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
          this.load();
        },
      });
    });
  }
}

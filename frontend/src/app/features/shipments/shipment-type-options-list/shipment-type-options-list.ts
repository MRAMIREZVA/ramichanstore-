import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ShipmentTypeOption } from '../../../core/models/shipment.model';
import { ShipmentTypeOptionService } from '../../../core/services/shipment-type-option.service';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { ShipmentTypeOptionFormComponent, ShipmentTypeOptionFormData } from '../shipment-type-option-form/shipment-type-option-form';

@Component({
  selector: 'app-shipment-type-options-list',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule, MatDialogModule],
  templateUrl: './shipment-type-options-list.html',
  styleUrl: './shipment-type-options-list.scss',
})
export class ShipmentTypeOptionsList implements OnInit {
  private readonly shipmentTypeOptionService = inject(ShipmentTypeOptionService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly displayedColumns = ['name', 'notes', 'actions'];
  readonly loading = signal(true);
  readonly options = signal<ShipmentTypeOption[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.shipmentTypeOptionService.findAll().subscribe({
      next: (res) => {
        this.options.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreate(): void {
    this.openForm(null);
  }

  openEdit(option: ShipmentTypeOption): void {
    this.openForm(option);
  }

  private openForm(option: ShipmentTypeOption | null): void {
    const data: ShipmentTypeOptionFormData = { option };
    const ref = this.dialog.open(ShipmentTypeOptionFormComponent, { data, width: '460px', autoFocus: false });
    ref.afterClosed().subscribe((request) => {
      if (!request) return;
      const obs = option
        ? this.shipmentTypeOptionService.update(option.id, request)
        : this.shipmentTypeOptionService.create(request);
      obs.subscribe({
        next: (res) => {
          this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
          this.load();
        },
      });
    });
  }

  confirmDelete(option: ShipmentTypeOption): void {
    const data: ConfirmDialogData = {
      title: 'Eliminar tipo de envío',
      message: `¿Eliminar "${option.name}"? Si tiene embarques registrados, no se podrá eliminar.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    };
    const ref = this.dialog.open(ConfirmDialog, { data, width: '420px' });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.shipmentTypeOptionService.delete(option.id).subscribe({
        next: (res) => {
          this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
          this.load();
        },
      });
    });
  }
}

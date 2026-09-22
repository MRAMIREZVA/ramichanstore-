import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ShipmentRecipient } from '../../../core/models/shipment.model';
import { ShipmentRecipientService } from '../../../core/services/shipment-recipient.service';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { ShipmentRecipientFormComponent, ShipmentRecipientFormData } from '../shipment-recipient-form/shipment-recipient-form';

@Component({
  selector: 'app-shipment-recipients-list',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule, MatDialogModule],
  templateUrl: './shipment-recipients-list.html',
  styleUrl: './shipment-recipients-list.scss',
})
export class ShipmentRecipientsList implements OnInit {
  private readonly shipmentRecipientService = inject(ShipmentRecipientService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly displayedColumns = ['name', 'notes', 'actions'];
  readonly loading = signal(true);
  readonly recipients = signal<ShipmentRecipient[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.shipmentRecipientService.findAll().subscribe({
      next: (res) => {
        this.recipients.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreate(): void {
    this.openForm(null);
  }

  openEdit(recipient: ShipmentRecipient): void {
    this.openForm(recipient);
  }

  private openForm(recipient: ShipmentRecipient | null): void {
    const data: ShipmentRecipientFormData = { recipient };
    const ref = this.dialog.open(ShipmentRecipientFormComponent, { data, width: '460px', autoFocus: false });
    ref.afterClosed().subscribe((request) => {
      if (!request) return;
      const obs = recipient
        ? this.shipmentRecipientService.update(recipient.id, request)
        : this.shipmentRecipientService.create(request);
      obs.subscribe({
        next: (res) => {
          this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
          this.load();
        },
      });
    });
  }

  confirmDelete(recipient: ShipmentRecipient): void {
    const data: ConfirmDialogData = {
      title: 'Eliminar titular del embarque',
      message: `¿Eliminar a "${recipient.name}"? Si tiene embarques registrados, no se podrá eliminar.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    };
    const ref = this.dialog.open(ConfirmDialog, { data, width: '420px' });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.shipmentRecipientService.delete(recipient.id).subscribe({
        next: (res) => {
          this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
          this.load();
        },
      });
    });
  }
}

import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { PortalReservation } from '../../../core/models/portal.model';

export interface ReservationShippingDialogData {
  reservation: PortalReservation;
}

/** Ver Detalles de Envío: solo muestra fecha límite y llegada estimada, ya existentes en la reserva — sin conexión al módulo de Embarques (decisión explícita del dueño). */
@Component({
  selector: 'app-reservation-shipping-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './reservation-shipping-dialog.html',
  styleUrl: './reservation-shipping-dialog.scss',
})
export class ReservationShippingDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ReservationShippingDialogComponent>);
  readonly data = inject<ReservationShippingDialogData>(MAT_DIALOG_DATA);

  close(): void {
    this.dialogRef.close();
  }
}

import { SlicePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { PREORDER_STATUS_LABELS, PreorderReservation } from '../../../core/models/preorder.model';
import { resolveImageUrl } from '../../../core/utils/image-url';
import { BuyerCardComponent } from '../../../shared/components/buyer-card/buyer-card';

export interface ReservationDetailData {
  reservation: PreorderReservation;
}

@Component({
  selector: 'app-reservation-detail',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, SlicePipe, BuyerCardComponent],
  templateUrl: './reservation-detail.html',
  styleUrl: './reservation-detail.scss',
})
export class ReservationDetailComponent {
  private readonly dialogRef = inject(MatDialogRef<ReservationDetailComponent>);
  readonly data = inject<ReservationDetailData>(MAT_DIALOG_DATA);

  readonly statusLabels = PREORDER_STATUS_LABELS;
  readonly resolveImageUrl = resolveImageUrl;

  close(): void {
    this.dialogRef.close();
  }
}

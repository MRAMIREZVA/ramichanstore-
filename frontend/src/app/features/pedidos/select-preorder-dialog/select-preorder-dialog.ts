import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { PREORDER_STATUS_LABELS, Preorder, PreorderStatus } from '../../../core/models/preorder.model';
import { PreorderService } from '../../../core/services/preorder.service';
import { resolveImageUrl } from '../../../core/utils/image-url';

/**
 * Primer paso de "Nueva reserva" desde la pestaña Preventas: elegir a qué
 * campaña de preventa pertenece la reserva. El resultado se le pasa a
 * PreorderReservationsComponent (mismo diálogo que ya usa "Campañas de
 * preventa" → ícono de grupos), sin duplicar el formulario de reserva.
 */
@Component({
  selector: 'app-select-preorder-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './select-preorder-dialog.html',
  styleUrl: './select-preorder-dialog.scss',
})
export class SelectPreorderDialogComponent {
  private readonly preorderService = inject(PreorderService);
  private readonly dialogRef = inject(MatDialogRef<SelectPreorderDialogComponent>);

  readonly resolveImageUrl = resolveImageUrl;
  readonly statusLabels = PREORDER_STATUS_LABELS;
  readonly searchControl = new FormControl('');
  readonly loading = signal(false);
  readonly searched = signal(false);
  readonly results = signal<Preorder[]>([]);

  constructor() {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          if (!term || term.trim().length < 2) {
            this.results.set([]);
            this.searched.set(false);
            return [];
          }
          this.loading.set(true);
          return this.preorderService.search({ search: term, page: 0, size: 15 });
        }),
      )
      .subscribe((res) => {
        this.results.set(res.data.content);
        this.loading.set(false);
        this.searched.set(true);
      });
  }

  statusLabel(status: PreorderStatus): string {
    return this.statusLabels[status];
  }

  select(preorder: Preorder): void {
    this.dialogRef.close(preorder);
  }

  close(): void {
    this.dialogRef.close(null);
  }
}

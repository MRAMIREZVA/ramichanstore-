import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { Customer } from '../../../core/models/customer.model';
import { Preorder, PreorderReservation } from '../../../core/models/preorder.model';
import { CustomerService } from '../../../core/services/customer.service';
import { PreorderService } from '../../../core/services/preorder.service';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog';

export interface PreorderReservationsData {
  preorder: Preorder;
}

@Component({
  selector: 'app-preorder-reservations',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './preorder-reservations.html',
  styleUrl: './preorder-reservations.scss',
})
export class PreorderReservationsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly customerService = inject(CustomerService);
  private readonly preorderService = inject(PreorderService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly dialogRef = inject(MatDialogRef<PreorderReservationsComponent>);
  readonly data = inject<PreorderReservationsData>(MAT_DIALOG_DATA);

  readonly preorder = signal(this.data.preorder);
  readonly reservations = signal<PreorderReservation[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly changed = signal(false);
  readonly searching = signal(false);
  readonly customerOptions = signal<Customer[]>([]);
  readonly selectedCustomer = signal<Customer | null>(null);

  readonly displayedColumns = ['customer', 'quantity', 'deposit', 'date', 'actions'];

  readonly form = this.fb.group({
    customerSearch: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    depositAmount: [0, [Validators.required, Validators.min(0)]],
    notes: [''],
  });

  constructor() {
    this.loadReservations();

    this.form.controls.customerSearch.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          if (!term || (this.selectedCustomer() && term === this.customerLabel(this.selectedCustomer()!))) {
            return [];
          }
          this.searching.set(true);
          return this.customerService.search({ search: term, page: 0, size: 10 });
        }),
      )
      .subscribe({
        next: (res) => {
          this.customerOptions.set(res.data.content);
          this.searching.set(false);
        },
        error: () => this.searching.set(false),
      });
  }

  customerLabel(customer: Customer | string | null): string {
    return customer && typeof customer === 'object' ? `${customer.fullName} — ${customer.phone}` : (customer ?? '');
  }

  onCustomerSelected(customer: Customer): void {
    this.selectedCustomer.set(customer);
    this.form.controls.customerSearch.setValue(this.customerLabel(customer), { emitEvent: false });
    this.customerOptions.set([]);
  }

  loadReservations(): void {
    this.loading.set(true);
    this.preorderService.listReservations(this.preorder().id).subscribe({
      next: (res) => {
        this.reservations.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private refreshPreorder(): void {
    this.preorderService.findById(this.preorder().id).subscribe((res) => this.preorder.set(res.data));
  }

  addReservation(): void {
    const customer = this.selectedCustomer();
    if (!customer || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();

    this.saving.set(true);
    this.preorderService
      .addReservation(this.preorder().id, {
        customerId: customer.id,
        quantity: Number(v.quantity),
        depositAmount: Number(v.depositAmount),
        notes: v.notes || null,
      })
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          this.changed.set(true);
          this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
          this.form.reset({ customerSearch: '', quantity: 1, depositAmount: 0, notes: '' });
          this.selectedCustomer.set(null);
          this.loadReservations();
          this.refreshPreorder();
        },
        error: () => this.saving.set(false),
      });
  }

  cancelReservation(reservation: PreorderReservation): void {
    const data: ConfirmDialogData = {
      title: 'Cancelar reserva',
      message: `¿Cancelar la reserva de "${reservation.customerName}" (${reservation.quantity} unidad(es))? Libera esos cupos.`,
      confirmLabel: 'Cancelar reserva',
      destructive: true,
    };
    const ref = this.dialog.open(ConfirmDialog, { data, width: '420px' });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.preorderService.cancelReservation(this.preorder().id, reservation.id).subscribe({
        next: (res) => {
          this.changed.set(true);
          this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
          this.loadReservations();
          this.refreshPreorder();
        },
      });
    });
  }

  close(): void {
    this.dialogRef.close(this.changed());
  }
}

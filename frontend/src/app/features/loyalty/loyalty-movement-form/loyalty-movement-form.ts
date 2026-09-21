import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { Customer } from '../../../core/models/customer.model';
import {
  LOYALTY_MOVEMENT_TYPE_LABELS,
  LOYALTY_TYPES_THAT_INCREASE,
  LoyaltyMovementType,
} from '../../../core/models/loyalty.model';
import { CustomerService } from '../../../core/services/customer.service';
import { LoyaltyService } from '../../../core/services/loyalty.service';

const ADJUSTABLE_TYPES: LoyaltyMovementType[] = ['CANJE', 'AJUSTE_MANUAL', 'BONIFICACION'];

@Component({
  selector: 'app-loyalty-movement-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './loyalty-movement-form.html',
  styleUrl: './loyalty-movement-form.scss',
})
export class LoyaltyMovementFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly customerService = inject(CustomerService);
  private readonly loyaltyService = inject(LoyaltyService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<LoyaltyMovementFormComponent>);

  readonly typeOptions = ADJUSTABLE_TYPES.map((t) => [t, LOYALTY_MOVEMENT_TYPE_LABELS[t]] as [LoyaltyMovementType, string]);
  readonly saving = signal(false);
  readonly searching = signal(false);
  readonly customerOptions = signal<Customer[]>([]);
  readonly selectedCustomer = signal<Customer | null>(null);

  readonly form = this.fb.group({
    customerSearch: ['', Validators.required],
    movementType: ['BONIFICACION' as LoyaltyMovementType, Validators.required],
    points: [0, Validators.required],
    reason: ['', [Validators.required, Validators.maxLength(255)]],
  });

  readonly directionHint = computed(() => {
    const type = this.form.controls.movementType.value;
    if (!type) return '';
    if (type === 'AJUSTE_MANUAL') return 'Ingresa un valor positivo para sumar o negativo para restar puntos.';
    return LOYALTY_TYPES_THAT_INCREASE.includes(type)
      ? 'Este tipo suma puntos. Ingresa un valor positivo.'
      : 'Este tipo resta puntos. Ingresa un valor positivo.';
  });

  constructor() {
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

  save(): void {
    const customer = this.selectedCustomer();
    if (!customer || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const type = v.movementType as LoyaltyMovementType;
    const rawPoints = Number(v.points);
    const points = type === 'AJUSTE_MANUAL' ? rawPoints : Math.abs(rawPoints);

    this.saving.set(true);
    this.loyaltyService
      .registerMovement({ customerId: customer.id, movementType: type, points, reason: v.reason! })
      .subscribe({
        next: (response) => {
          this.saving.set(false);
          this.snackBar.open(response.message, 'Cerrar', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: () => this.saving.set(false),
      });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}

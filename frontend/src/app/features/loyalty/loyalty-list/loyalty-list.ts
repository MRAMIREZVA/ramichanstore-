import { DatePipe, KeyValuePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { Customer } from '../../../core/models/customer.model';
import { LOYALTY_MOVEMENT_TYPE_LABELS, LoyaltyMovement, LoyaltyMovementType } from '../../../core/models/loyalty.model';
import { CustomerService } from '../../../core/services/customer.service';
import { LoyaltyFilters, LoyaltyService } from '../../../core/services/loyalty.service';
import { LoyaltyMovementFormComponent } from '../loyalty-movement-form/loyalty-movement-form';

@Component({
  selector: 'app-loyalty-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    KeyValuePipe,
    DatePipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './loyalty-list.html',
  styleUrl: './loyalty-list.scss',
})
export class LoyaltyList implements OnInit {
  private readonly loyaltyService = inject(LoyaltyService);
  private readonly customerService = inject(CustomerService);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);

  readonly typeLabels = LOYALTY_MOVEMENT_TYPE_LABELS;
  readonly typeOptions = Object.entries(LOYALTY_MOVEMENT_TYPE_LABELS) as [LoyaltyMovementType, string][];
  readonly displayedColumns = ['date', 'customer', 'type', 'points', 'reason', 'user'];

  readonly loading = signal(true);
  readonly movements = signal<LoyaltyMovement[]>([]);
  readonly totalElements = signal(0);

  readonly typeControl = new FormControl<LoyaltyMovementType | null>(null);
  readonly customerFilterControl = new FormControl('');
  readonly customerOptions = signal<Customer[]>([]);
  readonly selectedCustomer = signal<Customer | null>(null);
  readonly selectedCustomerBalance = signal<number | null>(null);

  page = 0;
  pageSize = 20;

  ngOnInit(): void {
    this.typeControl.valueChanges.subscribe(() => {
      this.page = 0;
      this.load();
    });

    this.customerFilterControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          if (!term || (this.selectedCustomer() && term === this.customerLabel(this.selectedCustomer()!))) {
            return [];
          }
          return this.customerService.search({ search: term, page: 0, size: 10 });
        }),
      )
      .subscribe((res) => this.customerOptions.set(res.data.content));

    // Pre-filtro por cliente al llegar desde "Ver historial de puntos" en la ficha del cliente (customer-detail).
    const customerId = this.route.snapshot.queryParamMap.get('customerId');
    const customerName = this.route.snapshot.queryParamMap.get('customerName');
    const customerPhone = this.route.snapshot.queryParamMap.get('customerPhone');
    if (customerId && customerName) {
      this.onCustomerSelected({ id: Number(customerId), fullName: customerName, phone: customerPhone ?? '' } as Customer);
      return;
    }

    this.load();
  }

  customerLabel(customer: Customer | string | null): string {
    if (!customer || typeof customer !== 'object') return customer ?? '';
    return customer.phone ? `${customer.fullName} — ${customer.phone}` : customer.fullName;
  }

  onCustomerSelected(customer: Customer): void {
    this.selectedCustomer.set(customer);
    this.customerFilterControl.setValue(this.customerLabel(customer), { emitEvent: false });
    this.customerOptions.set([]);
    this.loyaltyService.getBalance(customer.id).subscribe((res) => this.selectedCustomerBalance.set(res.data.balance));
    this.page = 0;
    this.load();
  }

  clearCustomerFilter(): void {
    this.selectedCustomer.set(null);
    this.selectedCustomerBalance.set(null);
    this.customerFilterControl.setValue('', { emitEvent: false });
    this.page = 0;
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const filters: LoyaltyFilters = {
      customerId: this.selectedCustomer()?.id ?? null,
      type: this.typeControl.value,
      page: this.page,
      size: this.pageSize,
    };
    this.loyaltyService.search(filters).subscribe({
      next: (res) => {
        this.movements.set(res.data.content);
        this.totalElements.set(res.data.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  typeLabel(type: LoyaltyMovementType): string {
    return this.typeLabels[type];
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  openMovementForm(): void {
    const ref = this.dialog.open<LoyaltyMovementFormComponent, void, boolean>(LoyaltyMovementFormComponent, {
      width: '600px',
      maxWidth: '95vw',
      autoFocus: false,
    });
    ref.afterClosed().subscribe((changed) => {
      if (changed) {
        this.load();
        if (this.selectedCustomer()) {
          this.loyaltyService.getBalance(this.selectedCustomer()!.id).subscribe((res) => this.selectedCustomerBalance.set(res.data.balance));
        }
      }
    });
  }
}

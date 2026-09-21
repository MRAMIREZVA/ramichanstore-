import { KeyValuePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
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
import { PAYMENT_STATUS_LABELS, PaymentStatus } from '../../../core/models/sale.model';
import { Separation } from '../../../core/models/separation.model';
import { CustomerService } from '../../../core/services/customer.service';
import { SeparationFilters, SeparationService } from '../../../core/services/separation.service';
import { toIsoDate } from '../../../core/utils/date';
import { SeparationFormComponent } from '../separation-form/separation-form';
import { SeparationPaymentsComponent, SeparationPaymentsData } from '../separation-payments/separation-payments';

@Component({
  selector: 'app-separations-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    KeyValuePipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './separations-list.html',
  styleUrl: './separations-list.scss',
})
export class SeparationsList implements OnInit {
  private readonly separationService = inject(SeparationService);
  private readonly customerService = inject(CustomerService);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);

  readonly statusLabels = PAYMENT_STATUS_LABELS;
  readonly displayedColumns = ['product', 'customer', 'total', 'balance', 'limitDate', 'status', 'actions'];

  readonly loading = signal(true);
  readonly separations = signal<Separation[]>([]);
  readonly totalElements = signal(0);

  readonly statusControl = new FormControl<PaymentStatus | null>(null);
  readonly fromControl = new FormControl<Date | null>(null);
  readonly toControl = new FormControl<Date | null>(null);
  readonly customerFilterControl = new FormControl('');

  readonly customerOptions = signal<Customer[]>([]);
  readonly selectedCustomer = signal<Customer | null>(null);

  page = 0;
  pageSize = 20;

  ngOnInit(): void {
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

    // Pre-filtro por cliente al llegar desde "Ver todas" en la ficha del cliente (customer-detail).
    const customerId = this.route.snapshot.queryParamMap.get('customerId');
    const customerName = this.route.snapshot.queryParamMap.get('customerName');
    if (customerId && customerName) {
      const customer = { id: Number(customerId), fullName: customerName } as Customer;
      this.onCustomerSelected(customer);
      return;
    }

    this.load();
  }

  load(): void {
    this.loading.set(true);
    const filters: SeparationFilters = {
      customerId: this.selectedCustomer()?.id ?? null,
      status: this.statusControl.value,
      from: toIsoDate(this.fromControl.value),
      to: toIsoDate(this.toControl.value),
      page: this.page,
      size: this.pageSize,
    };
    this.separationService.search(filters).subscribe({
      next: (res) => {
        this.separations.set(res.data.content);
        this.totalElements.set(res.data.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  statusLabel(status: PaymentStatus): string {
    return this.statusLabels[status];
  }

  customerLabel(customer: Customer | string | null): string {
    return customer && typeof customer === 'object' ? customer.fullName : (customer ?? '');
  }

  onCustomerSelected(customer: Customer): void {
    this.selectedCustomer.set(customer);
    this.customerFilterControl.setValue(this.customerLabel(customer), { emitEvent: false });
    this.customerOptions.set([]);
    this.page = 0;
    this.load();
  }

  clearCustomerFilter(): void {
    this.selectedCustomer.set(null);
    this.customerFilterControl.setValue('', { emitEvent: false });
    this.customerOptions.set([]);
    this.page = 0;
    this.load();
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  openCreate(): void {
    const ref = this.dialog.open<SeparationFormComponent, void, boolean>(SeparationFormComponent, {
      width: '640px',
      maxWidth: '95vw',
      autoFocus: false,
    });
    ref.afterClosed().subscribe((changed) => {
      if (changed) {
        this.load();
      }
    });
  }

  openPayments(separation: Separation): void {
    const data: SeparationPaymentsData = { separation };
    const ref = this.dialog.open<SeparationPaymentsComponent, SeparationPaymentsData, boolean>(
      SeparationPaymentsComponent,
      { data, width: '720px', maxWidth: '95vw', autoFocus: false },
    );
    ref.afterClosed().subscribe((changed) => {
      if (changed) {
        this.load();
      }
    });
  }
}

import { KeyValuePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { CUSTOMER_STATUS_LABELS, Customer, CustomerStatus } from '../../../core/models/customer.model';
import { CustomerFilters, CustomerService } from '../../../core/services/customer.service';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { CustomerDetailComponent, CustomerDetailData } from '../customer-detail/customer-detail';
import { CustomerFormComponent, CustomerFormData } from '../customer-form/customer-form';

@Component({
  selector: 'app-customers-list',
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
    MatPaginatorModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './customers-list.html',
  styleUrl: './customers-list.scss',
})
export class CustomersList implements OnInit {
  private readonly customerService = inject(CustomerService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly statusLabels = CUSTOMER_STATUS_LABELS;
  readonly displayedColumns = ['name', 'document', 'contact', 'district', 'status', 'actions'];

  readonly loading = signal(true);
  readonly customers = signal<Customer[]>([]);
  readonly totalElements = signal(0);

  readonly searchControl = new FormControl('');
  readonly statusControl = new FormControl<CustomerStatus | null>(null);

  page = 0;
  pageSize = 20;

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(debounceTime(350), distinctUntilChanged()).subscribe(() => {
      this.page = 0;
      this.load();
    });
    this.statusControl.valueChanges.subscribe(() => {
      this.page = 0;
      this.load();
    });

    this.load();
  }

  load(): void {
    this.loading.set(true);
    const filters: CustomerFilters = {
      search: this.searchControl.value ?? undefined,
      status: this.statusControl.value,
      page: this.page,
      size: this.pageSize,
    };
    this.customerService.search(filters).subscribe({
      next: (res) => {
        this.customers.set(res.data.content);
        this.totalElements.set(res.data.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  statusLabel(status: CustomerStatus): string {
    return this.statusLabels[status];
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  openCreate(): void {
    this.openForm(null);
  }

  openEdit(customer: Customer): void {
    this.openForm(customer);
  }

  openDetail(customer: Customer): void {
    const data: CustomerDetailData = { customer };
    const ref = this.dialog.open<CustomerDetailComponent, CustomerDetailData, boolean>(CustomerDetailComponent, {
      data,
      width: '560px',
      maxWidth: '95vw',
    });
    ref.afterClosed().subscribe((changed) => {
      if (changed) this.load();
    });
  }

  private openForm(customer: Customer | null): void {
    const ref = this.dialog.open<CustomerFormComponent, CustomerFormData, boolean>(CustomerFormComponent, {
      data: { customer },
      width: '700px',
      maxWidth: '95vw',
      autoFocus: false,
    });
    ref.afterClosed().subscribe((changed) => {
      if (changed) {
        this.load();
      }
    });
  }

  confirmDelete(customer: Customer): void {
    const data: ConfirmDialogData = {
      title: 'Eliminar cliente',
      message: `¿Seguro que deseas eliminar a "${customer.fullName}"? Esta acción lo oculta del listado pero conserva su historial.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    };
    const ref = this.dialog.open(ConfirmDialog, { data, width: '420px' });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.customerService.delete(customer.id).subscribe({
        next: (res) => {
          this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
          this.load();
        },
      });
    });
  }
}

import { DatePipe, KeyValuePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
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
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { AUDIT_ACTION_LABELS, AuditAction, AuditLogEntry } from '../../../core/models/audit.model';
import { AuditFilters, AuditService } from '../../../core/services/audit.service';
import { AuditDetailComponent, AuditDetailData } from '../audit-detail/audit-detail';

@Component({
  selector: 'app-audit-list',
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
    MatDatepickerModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './audit-list.html',
  styleUrl: './audit-list.scss',
})
export class AuditList implements OnInit {
  private readonly auditService = inject(AuditService);
  private readonly dialog = inject(MatDialog);

  readonly actionLabels = AUDIT_ACTION_LABELS;
  readonly displayedColumns = ['date', 'user', 'action', 'module', 'entity', 'ip'];

  readonly loading = signal(true);
  readonly entries = signal<AuditLogEntry[]>([]);
  readonly totalElements = signal(0);

  readonly moduleControl = new FormControl('');
  readonly actionControl = new FormControl<AuditAction | null>(null);
  readonly usernameControl = new FormControl('');
  readonly fromControl = new FormControl<Date | null>(null);
  readonly toControl = new FormControl<Date | null>(null);

  page = 0;
  pageSize = 30;

  ngOnInit(): void {
    this.moduleControl.valueChanges.pipe(debounceTime(350), distinctUntilChanged()).subscribe(() => {
      this.page = 0;
      this.load();
    });
    this.usernameControl.valueChanges.pipe(debounceTime(350), distinctUntilChanged()).subscribe(() => {
      this.page = 0;
      this.load();
    });
    this.actionControl.valueChanges.subscribe(() => {
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

    this.load();
  }

  load(): void {
    this.loading.set(true);
    const filters: AuditFilters = {
      module: this.moduleControl.value || null,
      action: this.actionControl.value,
      username: this.usernameControl.value || null,
      from: this.toIsoDate(this.fromControl.value),
      to: this.toIsoDate(this.toControl.value),
      page: this.page,
      size: this.pageSize,
    };
    this.auditService.search(filters).subscribe({
      next: (res) => {
        this.entries.set(res.data.content);
        this.totalElements.set(res.data.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  actionLabel(action: AuditAction): string {
    return this.actionLabels[action];
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  openDetail(entry: AuditLogEntry): void {
    const data: AuditDetailData = { entry };
    this.dialog.open(AuditDetailComponent, { data, width: '680px', maxWidth: '95vw' });
  }

  private toIsoDate(date: Date | null): string | null {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

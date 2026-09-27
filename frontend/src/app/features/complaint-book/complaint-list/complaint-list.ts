import { KeyValuePipe, SlicePipe } from '@angular/common';
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
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  Complaint,
  ComplaintStatus,
  ComplaintType,
  COMPLAINT_STATUS_LABELS,
  COMPLAINT_TYPE_LABELS,
} from '../../../core/models/complaint.model';
import { ComplaintFilters, ComplaintService } from '../../../core/services/complaint.service';
import { toIsoDate } from '../../../core/utils/date';
import {
  RespondComplaintDialogComponent,
  RespondComplaintDialogData,
} from '../respond-complaint-dialog/respond-complaint-dialog';

/**
 * Libro de Reclamaciones Virtual (Fase 43) — obligatorio por ley. Los reclamos
 * llegan del formulario público (`/libro-de-reclamaciones`, sin login); acá
 * el staff los revisa y registra la respuesta ("acciones adoptadas por el
 * proveedor") vía RespondComplaintDialogComponent.
 */
@Component({
  selector: 'app-complaint-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    KeyValuePipe,
    SlicePipe,
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
  templateUrl: './complaint-list.html',
  styleUrl: './complaint-list.scss',
})
export class ComplaintList implements OnInit {
  private readonly complaintService = inject(ComplaintService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly typeLabels = COMPLAINT_TYPE_LABELS;
  readonly statusLabels = COMPLAINT_STATUS_LABELS;
  readonly displayedColumns = ['folio', 'type', 'consumer', 'good', 'status', 'createdAt', 'actions'];

  readonly loading = signal(true);
  readonly complaints = signal<Complaint[]>([]);
  readonly totalElements = signal(0);

  readonly typeControl = new FormControl<ComplaintType | null>(null);
  readonly statusControl = new FormControl<ComplaintStatus | null>(null);
  readonly fromControl = new FormControl<Date | null>(null);
  readonly toControl = new FormControl<Date | null>(null);

  page = 0;
  pageSize = 20;

  ngOnInit(): void {
    const reload = () => {
      this.page = 0;
      this.load();
    };
    this.typeControl.valueChanges.subscribe(reload);
    this.statusControl.valueChanges.subscribe(reload);
    this.fromControl.valueChanges.subscribe(reload);
    this.toControl.valueChanges.subscribe(reload);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const filters: ComplaintFilters = {
      type: this.typeControl.value,
      status: this.statusControl.value,
      from: toIsoDate(this.fromControl.value),
      to: toIsoDate(this.toControl.value),
      page: this.page,
      size: this.pageSize,
    };
    this.complaintService.search(filters).subscribe({
      next: (res) => {
        this.complaints.set(res.data.content);
        this.totalElements.set(res.data.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  typeLabel(type: ComplaintType): string {
    return this.typeLabels[type];
  }

  statusLabel(status: ComplaintStatus): string {
    return this.statusLabels[status];
  }

  openRespond(complaint: Complaint): void {
    const data: RespondComplaintDialogData = { complaint };
    const ref = this.dialog.open(RespondComplaintDialogComponent, { data, width: '640px', maxWidth: '95vw' });
    ref.afterClosed().subscribe((request) => {
      if (!request) return;
      this.complaintService.respond(complaint.id, request).subscribe({
        next: (res) => {
          this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
          this.load();
        },
      });
    });
  }
}

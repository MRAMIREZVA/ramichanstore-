import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AuditLogEntry } from '../../../core/models/audit.model';

export interface AuditDetailData {
  entry: AuditLogEntry;
}

@Component({
  selector: 'app-audit-detail',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './audit-detail.html',
  styleUrl: './audit-detail.scss',
})
export class AuditDetailComponent {
  private readonly dialogRef = inject(MatDialogRef<AuditDetailComponent>);
  readonly data = inject<AuditDetailData>(MAT_DIALOG_DATA);

  pretty(value: string | null): string {
    if (!value) return '—';
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}

import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface AboutUsDialogData {
  storeName: string;
  text: string;
}

/** Diálogo simple abierto desde el link "Quiénes somos" del header del catálogo (Fase 76). */
@Component({
  selector: 'app-about-us-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './about-us-dialog.html',
  styleUrl: './about-us-dialog.scss',
})
export class AboutUsDialogComponent {
  readonly dialogRef = inject(MatDialogRef<AboutUsDialogComponent>);
  readonly data = inject<AboutUsDialogData>(MAT_DIALOG_DATA);
}

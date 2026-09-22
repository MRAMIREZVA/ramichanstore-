import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface ImagePreviewDialogData {
  imageUrl: string;
  title?: string;
}

/** Diálogo genérico para ver una imagen en grande — usado para confirmar que una foto subida cargó bien antes de guardar. */
@Component({
  selector: 'app-image-preview-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './image-preview-dialog.html',
  styleUrl: './image-preview-dialog.scss',
})
export class ImagePreviewDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ImagePreviewDialogComponent>);
  readonly data = inject<ImagePreviewDialogData>(MAT_DIALOG_DATA);

  close(): void {
    this.dialogRef.close();
  }
}

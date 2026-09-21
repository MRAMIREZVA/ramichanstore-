import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface AnnouncementPopupData {
  imageUrl: string;
}

/**
 * Panel flotante de bienvenida del catálogo público: por ahora solo muestra la
 * imagen que el admin sube desde Configuración → Catálogo (sin texto/link —
 * ver CatalogService.uploadAnnouncement). Se abre una vez por visita desde
 * CatalogLayout.
 */
@Component({
  selector: 'app-announcement-popup',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './announcement-popup.html',
  styleUrl: './announcement-popup.scss',
})
export class AnnouncementPopupComponent {
  constructor(
    public dialogRef: MatDialogRef<AnnouncementPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AnnouncementPopupData,
  ) {}
}

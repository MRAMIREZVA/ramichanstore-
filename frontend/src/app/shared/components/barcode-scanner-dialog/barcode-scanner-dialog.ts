import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';

/**
 * Diálogo reutilizable de escaneo de código de barras/QR con la cámara del dispositivo
 * (celular o laptop con webcam). Usa @zxing/browser, que decodifica tanto códigos de
 * barras clásicos (Code128/EAN, el código de fábrica de la caja) como QR — un solo
 * flujo de escaneo sirve para cualquiera de los dos, sin que el usuario tenga que elegir.
 * Cierra el diálogo devolviendo el texto decodificado (`dialogRef.close(code)`), igual
 * patrón que ConfirmDialog/LowStockDialog devolviendo su resultado por el close().
 */
@Component({
  selector: 'app-barcode-scanner-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './barcode-scanner-dialog.html',
  styleUrl: './barcode-scanner-dialog.scss',
})
export class BarcodeScannerDialogComponent implements OnInit, OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<BarcodeScannerDialogComponent>);
  @ViewChild('video', { static: true }) private readonly videoRef!: ElementRef<HTMLVideoElement>;

  private readonly reader = new BrowserMultiFormatReader();
  private controls: IScannerControls | null = null;

  readonly starting = signal(true);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    // Un @ViewChild con { static: true } recién queda poblado antes de ngOnInit, NUNCA en el
    // constructor (aunque "static" sugiera lo contrario) — llamarlo desde el constructor lanza
    // "Cannot read properties of undefined (reading 'nativeElement')" en todos los intentos.
    this.start();
  }

  private async start(): Promise<void> {
    const onFrame = (result: any, error: any) => {
      this.starting.set(false);
      if (result) {
        this.dialogRef.close(result.getText());
      } else if (error && !(error instanceof NotFoundException)) {
        // NotFoundException se dispara en CADA frame sin código detectado — es el caso normal,
        // no un error real. Cualquier otra excepción sí vale la pena mostrarla.
        this.errorMessage.set('No se pudo leer la cámara. Intenta de nuevo.');
      }
    };

    try {
      // "ideal" (no "exact"/valor plano) para no fallar con OverconstrainedError en dispositivos
      // sin cámara trasera real — una laptop/webcam no reporta facingMode "environment" y
      // rechazaría la constraint si fuera obligatoria; con "ideal" el navegador usa la que haya.
      this.controls = await this.reader.decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' } } },
        this.videoRef.nativeElement,
        onFrame,
      );
    } catch {
      try {
        // Reintento sin ninguna constraint (algunos navegadores/dispositivos rechazan hasta
        // un facingMode "ideal" si solo tienen una cámara sin metadata) antes de rendirse.
        this.controls = await this.reader.decodeFromConstraints({ video: true }, this.videoRef.nativeElement, onFrame);
      } catch {
        this.starting.set(false);
        this.errorMessage.set('No se pudo acceder a la cámara. Revisa los permisos del navegador.');
      }
    }
  }

  close(): void {
    this.dialogRef.close(null);
  }

  ngOnDestroy(): void {
    // Imprescindible: sin esto, la cámara queda "prendida" (el ícono de cámara activa del
    // navegador nunca se apaga) aunque el diálogo ya se haya cerrado.
    this.controls?.stop();
  }
}

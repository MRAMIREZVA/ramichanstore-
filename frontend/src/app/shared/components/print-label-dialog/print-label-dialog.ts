import { AfterViewChecked, Component, ElementRef, QueryList, ViewChildren, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import JsBarcode from 'jsbarcode';
import * as QRCode from 'qrcode';

export interface PrintLabelItem {
  sku: string;
  name: string;
  salePrice: number;
}

export interface PrintLabelDialogData {
  items: PrintLabelItem[];
}

interface PrintLabelItemState extends PrintLabelItem {
  copies: number;
}

type LabelFormat = 'BARCODE' | 'QR';

/**
 * Genera e imprime etiquetas a partir del SKU de cada producto — nunca se guarda una
 * imagen ni un código aparte, se dibuja al vuelo (jsbarcode/qrcode) cada vez, mismo
 * criterio de "nunca guardar lo que se puede calcular" ya usado en todo el proyecto.
 * Acepta uno o varios productos a la vez (cada uno con su propia cantidad de copias)
 * para imprimir una sola hoja A4 con etiquetas de productos distintos. El formato QR
 * es más tolerante a impresoras térmicas baratas y ángulos de cámara imperfectos que
 * un código de barras clásico — el escáner (BarcodeScannerDialog) ya lee ambos.
 */
@Component({
  selector: 'app-print-label-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    FormsModule,
  ],
  templateUrl: './print-label-dialog.html',
  styleUrl: './print-label-dialog.scss',
})
export class PrintLabelDialogComponent implements AfterViewChecked {
  private readonly dialogRef = inject(MatDialogRef<PrintLabelDialogComponent>);
  readonly data = inject<PrintLabelDialogData>(MAT_DIALOG_DATA);
  @ViewChildren('barcodeSvg') private readonly barcodeSvgs!: QueryList<ElementRef<SVGElement>>;
  @ViewChildren('qrCanvas') private readonly qrCanvases!: QueryList<ElementRef<HTMLCanvasElement>>;

  readonly items = signal<PrintLabelItemState[]>(this.data.items.map((i) => ({ ...i, copies: 1 })));
  readonly format = signal<LabelFormat>('BARCODE');

  /** Una entrada por etiqueta física a imprimir (un producto con copies=3 aporta 3 entradas). */
  readonly labelInstances = computed(() => this.items().flatMap((item) => Array.from({ length: item.copies }, () => item)));

  readonly totalLabels = computed(() => this.labelInstances().length);

  private renderedSignature = '';

  setCopies(index: number, value: number): void {
    const n = Math.min(50, Math.max(1, Math.round(value) || 1));
    this.items.update((items) => items.map((it, i) => (i === index ? { ...it, copies: n } : it)));
  }

  removeItem(index: number): void {
    this.items.update((items) => items.filter((_, i) => i !== index));
  }

  setFormat(format: LabelFormat): void {
    this.format.set(format);
    this.renderedSignature = ''; // fuerza el redibujado: cambió el tipo de gráfico, no solo los datos.
  }

  ngAfterViewChecked(): void {
    // Redibuja solo cuando cambia la lista real de etiquetas (producto+cantidad+formato) —
    // ngAfterViewChecked corre en CADA ciclo de detección de cambios, así que sin este chequeo
    // redibujaría los mismos gráficos constantemente (ej. al mover el mouse) sin necesidad.
    const instances = this.labelInstances();
    const signature = this.format() + '|' + instances.map((i) => i.sku).join('|');
    const refs = this.format() === 'BARCODE' ? this.barcodeSvgs : this.qrCanvases;
    if (refs.length === 0 || signature === this.renderedSignature) return;
    this.renderedSignature = signature;

    if (this.format() === 'BARCODE') {
      this.barcodeSvgs.forEach((ref, i) => {
        const item = instances[i];
        if (!item) return;
        JsBarcode(ref.nativeElement, item.sku, {
          format: 'CODE128',
          displayValue: true,
          height: 50,
          width: 2,
          margin: 6,
          fontSize: 14,
        });
      });
    } else {
      this.qrCanvases.forEach((ref, i) => {
        const item = instances[i];
        if (!item) return;
        QRCode.toCanvas(ref.nativeElement, item.sku, { width: 110, margin: 1 }).catch(() => {});
      });
    }
  }

  print(): void {
    window.print();
  }

  close(): void {
    this.dialogRef.close();
  }
}

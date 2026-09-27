import { Component, ElementRef, QueryList, ViewChildren, AfterViewInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import JsBarcode from 'jsbarcode';

export interface PrintLabelDialogData {
  sku: string;
  name: string;
  salePrice: number;
}

/**
 * Genera e imprime una etiqueta con código de barras (Code128) a partir del SKU del
 * producto — nunca se guarda una imagen ni un código aparte, se dibuja al vuelo con
 * jsbarcode cada vez (mismo criterio de "nunca guardar lo que se puede calcular" ya
 * usado en todo el proyecto). Imprime tantas copias idénticas como se pida (útil para
 * pegar una etiqueta por unidad física de un mismo producto).
 */
@Component({
  selector: 'app-print-label-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, FormsModule],
  templateUrl: './print-label-dialog.html',
  styleUrl: './print-label-dialog.scss',
})
export class PrintLabelDialogComponent implements AfterViewInit {
  private readonly dialogRef = inject(MatDialogRef<PrintLabelDialogComponent>);
  readonly data = inject<PrintLabelDialogData>(MAT_DIALOG_DATA);
  @ViewChildren('barcodeSvg') private readonly barcodeSvgs!: QueryList<ElementRef<SVGElement>>;

  readonly copies = signal(1);
  readonly labelIndexes = signal<number[]>([0]);

  ngAfterViewInit(): void {
    this.renderBarcodes();
  }

  setCopies(value: number): void {
    const n = Math.min(50, Math.max(1, Math.round(value) || 1));
    this.copies.set(n);
    this.labelIndexes.set(Array.from({ length: n }, (_, i) => i));
    // El *ngFor recién agrega los <svg> nuevos al DOM en este mismo ciclo — hay que
    // esperar al siguiente para que ViewChildren los vea, si no jsbarcode dibuja de menos.
    setTimeout(() => this.renderBarcodes(), 0);
  }

  private renderBarcodes(): void {
    this.barcodeSvgs.forEach((ref) => {
      JsBarcode(ref.nativeElement, this.data.sku, {
        format: 'CODE128',
        displayValue: true,
        height: 50,
        width: 2,
        margin: 6,
        fontSize: 14,
      });
    });
  }

  print(): void {
    window.print();
  }

  close(): void {
    this.dialogRef.close();
  }
}

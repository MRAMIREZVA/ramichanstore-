import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Product } from '../../../core/models/product.model';

export interface LowStockDialogData {
  products: Product[];
}

/**
 * Lista completa de productos en stock mínimo o por debajo — antes se pintaban todos como chips
 * directo en la página de Inventario (roto con 250+ productos reales, ver lección). Acá viven en un
 * diálogo con buscador propio (filtrado en memoria, la lista ya llegó completa desde `lowStock()`).
 */
@Component({
  selector: 'app-low-stock-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatTooltipModule],
  templateUrl: './low-stock-dialog.html',
  styleUrl: './low-stock-dialog.scss',
})
export class LowStockDialogComponent {
  readonly data = inject<LowStockDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<LowStockDialogComponent, Product | null>);

  readonly searchControl = new FormControl('');
  private readonly search = signal('');

  readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) return this.data.products;
    return this.data.products.filter(
      (p) => p.sku.toLowerCase().includes(term) || p.name.toLowerCase().includes(term),
    );
  });

  constructor() {
    this.searchControl.valueChanges.subscribe((value) => this.search.set(value ?? ''));
  }

  registerMovement(product: Product): void {
    this.dialogRef.close(product);
  }

  close(): void {
    this.dialogRef.close(null);
  }
}

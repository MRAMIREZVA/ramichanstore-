import { Component, computed, input } from '@angular/core';

export interface BarItem {
  label: string;
  value: number;
}

/** Barras horizontales de una sola magnitud (top productos/categorías, etc.). */
@Component({
  selector: 'app-simple-bar-chart',
  standalone: true,
  templateUrl: './simple-bar-chart.html',
  styleUrl: './simple-bar-chart.scss',
})
export class SimpleBarChartComponent {
  readonly items = input.required<BarItem[]>();
  readonly color = input<string>('#2a78d6');
  readonly valuePrefix = input<string>('');
  readonly integer = input<boolean>(false);
  readonly emptyMessage = input<string>('Sin datos en el período seleccionado.');

  private readonly maxValue = computed(() => Math.max(1, ...this.items().map((i) => i.value)));

  barWidthPercent(value: number): number {
    return (value / this.maxValue()) * 100;
  }

  formattedValue(value: number): string {
    const digits = this.integer() ? 0 : 2;
    return `${this.valuePrefix()}${value.toLocaleString('es-PE', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
  }
}

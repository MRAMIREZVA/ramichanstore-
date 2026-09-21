import { Component, computed, input, signal } from '@angular/core';

export interface LineSeries {
  name: string;
  color: string;
  values: number[];
}

/**
 * Gráfico de líneas simple, sin dependencias externas. Todas las series
 * comparten UN solo eje Y (nunca un dual-axis — ver skill de dataviz,
 * anti-patrón #1); por eso solo tiene sentido para series con la misma unidad
 * (ej. ventas y ganancia, ambas en soles).
 */
@Component({
  selector: 'app-simple-line-chart',
  standalone: true,
  templateUrl: './simple-line-chart.html',
  styleUrl: './simple-line-chart.scss',
})
export class SimpleLineChartComponent {
  readonly labels = input.required<string[]>();
  readonly series = input.required<LineSeries[]>();

  readonly width = 640;
  readonly height = 220;
  private readonly paddingLeft = 48;
  private readonly paddingRight = 16;
  private readonly paddingTop = 16;
  private readonly paddingBottom = 28;

  readonly hoverIndex = signal<number | null>(null);

  private readonly maxValue = computed(() => {
    const all = this.series().flatMap((s) => s.values);
    return Math.max(1, ...all);
  });

  readonly yTicks = computed(() => {
    const max = this.maxValue();
    return [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));
  });

  private readonly plotWidth = this.width - this.paddingLeft - this.paddingRight;
  private readonly plotHeight = this.height - this.paddingTop - this.paddingBottom;

  private xFor(index: number): number {
    const count = this.labels().length;
    if (count <= 1) return this.paddingLeft + this.plotWidth / 2;
    return this.paddingLeft + (index / (count - 1)) * this.plotWidth;
  }

  private yFor(value: number): number {
    const max = this.maxValue();
    return this.paddingTop + this.plotHeight - (value / max) * this.plotHeight;
  }

  linePath(values: number[]): string {
    return values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${this.xFor(i)} ${this.yFor(v)}`).join(' ');
  }

  pointX(index: number): number {
    return this.xFor(index);
  }

  pointY(value: number): number {
    return this.yFor(value);
  }

  gridY(tick: number): number {
    return this.yFor(tick);
  }

  onHover(index: number): void {
    this.hoverIndex.set(index);
  }

  onLeave(): void {
    this.hoverIndex.set(null);
  }

  readonly axisBaselineY = this.paddingTop + this.plotHeight;
  readonly axisLeftX = this.paddingLeft;

  readonly labelStep = computed(() => Math.max(1, Math.ceil(this.labels().length / 7)));

  showLabel(index: number): boolean {
    return index % this.labelStep() === 0 || index === this.labels().length - 1;
  }

  readonly hoverData = computed(() => {
    const index = this.hoverIndex();
    if (index === null) return null;
    return {
      label: this.labels()[index],
      values: this.series().map((s) => ({ name: s.name, color: s.color, value: s.values[index] ?? 0 })),
      x: this.pointX(index),
    };
  });
}

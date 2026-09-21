import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LineSeries, SimpleLineChartComponent } from '../../../shared/components/charts/simple-line-chart/simple-line-chart';
import { BarItem, SimpleBarChartComponent } from '../../../shared/components/charts/simple-bar-chart/simple-bar-chart';
import { ReportCharts } from '../../../core/models/report.model';
import { ReportExportFormat, ReportService } from '../../../core/services/report.service';

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    SimpleLineChartComponent,
    SimpleBarChartComponent,
  ],
  templateUrl: './reports-page.html',
  styleUrl: './reports-page.scss',
})
export class ReportsPage implements OnInit {
  private readonly reportService = inject(ReportService);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(true);
  readonly exporting = signal(false);
  readonly charts = signal<ReportCharts | null>(null);

  readonly fromControl = new FormControl<Date | null>(this.firstDayOfMonth());
  readonly toControl = new FormControl<Date | null>(new Date());

  readonly salesLabels = computed(() => this.charts()?.dailySales.map((d) => this.shortDate(d.date)) ?? []);
  readonly salesSeries = computed<LineSeries[]>(() => [
    { name: 'Ventas', color: '#2a78d6', values: this.charts()?.dailySales.map((d) => d.sales) ?? [] },
    { name: 'Ganancia', color: '#eb6834', values: this.charts()?.dailySales.map((d) => d.profit) ?? [] },
  ]);

  readonly topProductsBars = computed<BarItem[]>(
    () => this.charts()?.topProducts.map((p) => ({ label: p.productName, value: p.revenue })) ?? [],
  );
  readonly topCategoriesBars = computed<BarItem[]>(
    () => this.charts()?.topCategories.map((c) => ({ label: c.categoryName, value: c.revenue })) ?? [],
  );
  readonly customerGrowthBars = computed<BarItem[]>(
    () => this.charts()?.customerGrowth.map((c) => ({ label: this.shortDate(c.date), value: c.newCustomers })) ?? [],
  );

  ngOnInit(): void {
    this.fromControl.valueChanges.subscribe(() => this.load());
    this.toControl.valueChanges.subscribe(() => this.load());
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const from = this.toIsoDate(this.fromControl.value);
    const to = this.toIsoDate(this.toControl.value);
    this.reportService.getCharts(from, to).subscribe({
      next: (res) => {
        this.charts.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  exportReport(format: ReportExportFormat): void {
    this.exporting.set(true);
    const from = this.toIsoDate(this.fromControl.value);
    const to = this.toIsoDate(this.toControl.value);
    this.reportService.exportReport(from, to, format).subscribe({
      next: (res) => {
        this.exporting.set(false);
        this.downloadBlob(res.body!, this.filenameFrom(res.headers.get('Content-Disposition'), format));
      },
      error: () => {
        this.exporting.set(false);
        this.snackBar.open('No se pudo generar el archivo', 'Cerrar', { duration: 4000 });
      },
    });
  }

  private filenameFrom(contentDisposition: string | null, format: ReportExportFormat): string {
    const match = contentDisposition?.match(/filename="?([^";]+)"?/);
    return match ? match[1] : `reporte-ventas.${format}`;
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  private firstDayOfMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private toIsoDate(date: Date | null): string | null {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private shortDate(iso: string): string {
    const [, month, day] = iso.split('-');
    return `${day}/${month}`;
  }
}

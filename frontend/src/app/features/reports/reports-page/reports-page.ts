import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LineSeries, SimpleLineChartComponent } from '../../../shared/components/charts/simple-line-chart/simple-line-chart';
import { BarItem, SimpleBarChartComponent } from '../../../shared/components/charts/simple-bar-chart/simple-bar-chart';
import { ReportCharts } from '../../../core/models/report.model';
import { ReportService } from '../../../core/services/report.service';

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
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

  readonly loading = signal(true);
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

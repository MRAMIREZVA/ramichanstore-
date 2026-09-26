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
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LineSeries, SimpleLineChartComponent } from '../../../shared/components/charts/simple-line-chart/simple-line-chart';
import { BarItem, SimpleBarChartComponent } from '../../../shared/components/charts/simple-bar-chart/simple-bar-chart';
import { CustomerDebt, ReceivablesReport, ReportCharts } from '../../../core/models/report.model';
import { PREORDER_STATUS_LABELS, PreorderStatus } from '../../../core/models/preorder.model';
import { ReportExportFormat, ReportService } from '../../../core/services/report.service';
import { whatsAppLink } from '../../../core/utils/whatsapp';

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
    MatTableModule,
    MatTabsModule,
    MatTooltipModule,
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
    { name: 'Ganancia', color: '#eb6834', dashed: true, values: this.charts()?.dailySales.map((d) => d.profit) ?? [] },
  ]);

  /** Calculados en el cliente a partir de los mismos datos que ya trae `charts()` — sin endpoint nuevo. */
  readonly totalSales = computed(() => this.sum(this.charts()?.dailySales.map((d) => d.sales)));
  readonly totalProfit = computed(() => this.sum(this.charts()?.dailySales.map((d) => d.profit)));
  readonly marginPercent = computed(() => {
    const sales = this.totalSales();
    return sales > 0 ? (this.totalProfit() / sales) * 100 : 0;
  });
  readonly newCustomersTotal = computed(() => this.sum(this.charts()?.customerGrowth.map((c) => c.newCustomers)));

  /** "Cuentas por cobrar" — snapshot en vivo, se carga recién al abrir la pestaña (sin endpoint de más si nunca se visita). */
  readonly receivables = signal<ReceivablesReport | null>(null);
  readonly loadingReceivables = signal(false);
  private receivablesLoaded = false;
  readonly debtColumns = ['customer', 'sales', 'separations', 'preorders', 'total', 'actions'];
  readonly preorderColumns = ['customer', 'product', 'status', 'balance', 'eta'];
  readonly preorderStatusLabels = PREORDER_STATUS_LABELS;

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

  onTabChange(index: number): void {
    if (index === 1 && !this.receivablesLoaded) {
      this.receivablesLoaded = true;
      this.loadReceivables();
    }
  }

  loadReceivables(): void {
    this.loadingReceivables.set(true);
    this.reportService.getReceivables().subscribe({
      next: (res) => {
        this.receivables.set(res.data);
        this.loadingReceivables.set(false);
      },
      error: () => this.loadingReceivables.set(false),
    });
  }

  /** null si el cliente no dejó ni WhatsApp ni teléfono — el botón de cobro no se muestra en ese caso. */
  whatsAppLinkFor(debt: CustomerDebt): string | null {
    const phone = debt.customerWhatsapp ?? debt.customerPhone;
    if (!phone) return null;
    const message = `Hola ${debt.customerName}, te escribo de RamichanStore para recordarte tu saldo pendiente de S/ ${debt.totalBalance.toFixed(2)}.`;
    return whatsAppLink(phone, message);
  }

  preorderStatusLabel(status: string): string {
    return this.preorderStatusLabels[status as PreorderStatus] ?? status;
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

  private sum(values: number[] | undefined): number {
    return (values ?? []).reduce((acc, v) => acc + v, 0);
  }
}

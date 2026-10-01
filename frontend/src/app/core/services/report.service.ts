import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { DashboardSummary, InventoryValuation, ReceivablesReport, ReportCharts } from '../models/report.model';

export type ReportExportFormat = 'xlsx' | 'csv' | 'pdf';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/reports`;

  getDashboard(): Observable<ApiResponse<DashboardSummary>> {
    return this.http.get<ApiResponse<DashboardSummary>>(`${this.baseUrl}/dashboard`);
  }

  getCharts(from: string | null, to: string | null): Observable<ApiResponse<ReportCharts>> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<ApiResponse<ReportCharts>>(`${this.baseUrl}/charts`, { params });
  }

  /** Snapshot en vivo — sin rango de fechas, muestra el saldo pendiente y las preventas activas AHORA. */
  getReceivables(): Observable<ApiResponse<ReceivablesReport>> {
    return this.http.get<ApiResponse<ReceivablesReport>>(`${this.baseUrl}/receivables`);
  }

  /** Snapshot en vivo — cuánto vale el stock actual, a costo y a precio de venta. */
  getInventoryValuation(): Observable<ApiResponse<InventoryValuation>> {
    return this.http.get<ApiResponse<InventoryValuation>>(`${this.baseUrl}/inventory-valuation`);
  }

  /** El nombre real del archivo viene en Content-Disposition (lo arma el backend con el rango efectivo). */
  exportReport(from: string | null, to: string | null, format: ReportExportFormat): Observable<HttpResponse<Blob>> {
    let params = new HttpParams().set('format', format);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get(`${this.baseUrl}/export`, { params, responseType: 'blob', observe: 'response' });
  }
}

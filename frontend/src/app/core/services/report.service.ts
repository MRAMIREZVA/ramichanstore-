import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { DashboardSummary, ReportCharts } from '../models/report.model';

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
}

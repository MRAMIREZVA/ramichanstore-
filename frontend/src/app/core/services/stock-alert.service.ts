import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { StockAlert, StockAlertSubmission } from '../models/stock-alert.model';

@Injectable({ providedIn: 'root' })
export class StockAlertService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/stock-alerts`;

  /** Público — sin token, lo llama el detalle del catálogo en un producto agotado. */
  submit(request: StockAlertSubmission): Observable<ApiResponse<StockAlert>> {
    return this.http.post<ApiResponse<StockAlert>>(this.baseUrl, request);
  }

  /** Admin — los pendientes de un producto (ProductFormComponent al editar). */
  findPendingByProduct(productId: number): Observable<ApiResponse<StockAlert[]>> {
    const params = new HttpParams().set('productId', productId);
    return this.http.get<ApiResponse<StockAlert[]>>(this.baseUrl, { params });
  }

  markNotified(id: number): Observable<ApiResponse<StockAlert>> {
    return this.http.post<ApiResponse<StockAlert>>(`${this.baseUrl}/${id}/notify`, {});
  }
}

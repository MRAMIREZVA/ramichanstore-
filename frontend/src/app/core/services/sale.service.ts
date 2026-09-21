import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PageResponse } from '../models/page-response.model';
import { PaymentMethod, PaymentStatus, Sale, SaleRequest } from '../models/sale.model';

export interface SaleFilters {
  customerId?: number | null;
  status?: PaymentStatus | null;
  method?: PaymentMethod | null;
  from?: string | null;
  to?: string | null;
  page?: number;
  size?: number;
  /** ej. "saleDate,desc" — el backend acepta el formato estándar de Spring Data sin necesidad de un endpoint aparte. */
  sort?: string;
}

@Injectable({ providedIn: 'root' })
export class SaleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/sales`;

  search(filters: SaleFilters): Observable<ApiResponse<PageResponse<Sale>>> {
    let params = new HttpParams()
      .set('page', filters.page ?? 0)
      .set('size', filters.size ?? 20);
    if (filters.customerId) params = params.set('customerId', filters.customerId);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.method) params = params.set('method', filters.method);
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);
    if (filters.sort) params = params.set('sort', filters.sort);

    return this.http.get<ApiResponse<PageResponse<Sale>>>(this.baseUrl, { params });
  }

  findById(id: number): Observable<ApiResponse<Sale>> {
    return this.http.get<ApiResponse<Sale>>(`${this.baseUrl}/${id}`);
  }

  create(request: SaleRequest): Observable<ApiResponse<Sale>> {
    return this.http.post<ApiResponse<Sale>>(this.baseUrl, request);
  }

  cancel(id: number, reason: string): Observable<ApiResponse<Sale>> {
    return this.http.post<ApiResponse<Sale>>(`${this.baseUrl}/${id}/cancel`, { reason });
  }
}

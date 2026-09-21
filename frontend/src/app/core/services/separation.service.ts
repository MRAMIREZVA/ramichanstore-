import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PageResponse } from '../models/page-response.model';
import { PaymentStatus } from '../models/sale.model';
import { Separation, SeparationPayment, SeparationPaymentRequest, SeparationRequest } from '../models/separation.model';

export interface SeparationFilters {
  customerId?: number | null;
  status?: PaymentStatus | null;
  from?: string | null;
  to?: string | null;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class SeparationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/separations`;

  search(filters: SeparationFilters): Observable<ApiResponse<PageResponse<Separation>>> {
    let params = new HttpParams()
      .set('page', filters.page ?? 0)
      .set('size', filters.size ?? 20);
    if (filters.customerId) params = params.set('customerId', filters.customerId);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);

    return this.http.get<ApiResponse<PageResponse<Separation>>>(this.baseUrl, { params });
  }

  findById(id: number): Observable<ApiResponse<Separation>> {
    return this.http.get<ApiResponse<Separation>>(`${this.baseUrl}/${id}`);
  }

  create(request: SeparationRequest): Observable<ApiResponse<Separation>> {
    return this.http.post<ApiResponse<Separation>>(this.baseUrl, request);
  }

  listPayments(separationId: number): Observable<ApiResponse<SeparationPayment[]>> {
    return this.http.get<ApiResponse<SeparationPayment[]>>(`${this.baseUrl}/${separationId}/payments`);
  }

  registerPayment(separationId: number, request: SeparationPaymentRequest): Observable<ApiResponse<SeparationPayment>> {
    return this.http.post<ApiResponse<SeparationPayment>>(`${this.baseUrl}/${separationId}/payments`, request);
  }

  cancel(id: number, reason: string): Observable<ApiResponse<Separation>> {
    return this.http.post<ApiResponse<Separation>>(`${this.baseUrl}/${id}/cancel`, { reason });
  }
}

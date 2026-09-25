import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { OrderRequest, OrderRequestStatus, OrderRequestStatusInfo, OrderRequestSubmission } from '../models/order-request.model';
import { PageResponse } from '../models/page-response.model';

export interface OrderRequestFilters {
  status?: OrderRequestStatus | null;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class OrderRequestService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/order-requests`;

  /** Público — sin token, lo llama el checkout del catálogo. */
  submit(request: OrderRequestSubmission): Observable<ApiResponse<OrderRequest>> {
    return this.http.post<ApiResponse<OrderRequest>>(this.baseUrl, request);
  }

  search(filters: OrderRequestFilters): Observable<ApiResponse<PageResponse<OrderRequest>>> {
    let params = new HttpParams()
      .set('page', filters.page ?? 0)
      .set('size', filters.size ?? 20);
    if (filters.status) params = params.set('status', filters.status);
    return this.http.get<ApiResponse<PageResponse<OrderRequest>>>(this.baseUrl, { params });
  }

  findById(id: number): Observable<ApiResponse<OrderRequest>> {
    return this.http.get<ApiResponse<OrderRequest>>(`${this.baseUrl}/${id}`);
  }

  /** Público — el checkout hace polling acá mientras espera la confirmación IPN de un pago con Yape. */
  getStatus(id: number): Observable<ApiResponse<OrderRequestStatusInfo>> {
    return this.http.get<ApiResponse<OrderRequestStatusInfo>>(`${this.baseUrl}/${id}/status`);
  }

  convert(id: number): Observable<ApiResponse<OrderRequest>> {
    return this.http.post<ApiResponse<OrderRequest>>(`${this.baseUrl}/${id}/convert`, {});
  }

  reject(id: number, reason: string): Observable<ApiResponse<OrderRequest>> {
    return this.http.post<ApiResponse<OrderRequest>>(`${this.baseUrl}/${id}/reject`, { reason });
  }
}

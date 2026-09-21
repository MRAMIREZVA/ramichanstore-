import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Delivery, DeliveryRequest, DeliveryStatus, PendingPurchase } from '../models/delivery.model';
import { PageResponse } from '../models/page-response.model';

export interface DeliveryFilters {
  customerId?: number | null;
  status?: DeliveryStatus | null;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class DeliveryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/deliveries`;

  search(filters: DeliveryFilters): Observable<ApiResponse<PageResponse<Delivery>>> {
    let params = new HttpParams()
      .set('page', filters.page ?? 0)
      .set('size', filters.size ?? 20);
    if (filters.customerId) params = params.set('customerId', filters.customerId);
    if (filters.status) params = params.set('status', filters.status);

    return this.http.get<ApiResponse<PageResponse<Delivery>>>(this.baseUrl, { params });
  }

  findById(id: number): Observable<ApiResponse<Delivery>> {
    return this.http.get<ApiResponse<Delivery>>(`${this.baseUrl}/${id}`);
  }

  getPendingPurchases(customerId: number, excludeDeliveryId?: number | null): Observable<ApiResponse<PendingPurchase[]>> {
    let params = new HttpParams().set('customerId', customerId);
    if (excludeDeliveryId) params = params.set('excludeDeliveryId', excludeDeliveryId);
    return this.http.get<ApiResponse<PendingPurchase[]>>(`${this.baseUrl}/pending-purchases`, { params });
  }

  create(request: DeliveryRequest): Observable<ApiResponse<Delivery>> {
    return this.http.post<ApiResponse<Delivery>>(this.baseUrl, request);
  }

  update(id: number, request: DeliveryRequest): Observable<ApiResponse<Delivery>> {
    return this.http.put<ApiResponse<Delivery>>(`${this.baseUrl}/${id}`, request);
  }
}

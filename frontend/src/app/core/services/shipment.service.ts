import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PageResponse } from '../models/page-response.model';
import { Shipment, ShipmentRequest, ShipmentStatus, ShipmentType } from '../models/shipment.model';

export interface ShipmentFilters {
  search?: string;
  status?: ShipmentStatus | null;
  type?: ShipmentType | null;
  holderId?: number | null;
  from?: string | null;
  to?: string | null;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class ShipmentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/shipments`;

  search(filters: ShipmentFilters): Observable<ApiResponse<PageResponse<Shipment>>> {
    let params = new HttpParams()
      .set('page', filters.page ?? 0)
      .set('size', filters.size ?? 20);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.type) params = params.set('type', filters.type);
    if (filters.holderId) params = params.set('holderId', filters.holderId);
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);

    return this.http.get<ApiResponse<PageResponse<Shipment>>>(this.baseUrl, { params });
  }

  findById(id: number): Observable<ApiResponse<Shipment>> {
    return this.http.get<ApiResponse<Shipment>>(`${this.baseUrl}/${id}`);
  }

  create(request: ShipmentRequest): Observable<ApiResponse<Shipment>> {
    return this.http.post<ApiResponse<Shipment>>(this.baseUrl, request);
  }

  update(id: number, request: ShipmentRequest): Observable<ApiResponse<Shipment>> {
    return this.http.put<ApiResponse<Shipment>>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}

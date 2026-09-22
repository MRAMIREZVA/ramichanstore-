import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PageResponse } from '../models/page-response.model';
import {
  Shipment,
  ShipmentDocumentType,
  ShipmentRequest,
  ShipmentStatus,
  ShipmentType,
} from '../models/shipment.model';

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

  uploadItemImage(itemId: number, file: File): Observable<ApiResponse<void>> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ApiResponse<void>>(`${environment.apiBaseUrl}/shipments/items/${itemId}/image`, form);
  }

  deleteItemImage(itemId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${environment.apiBaseUrl}/shipments/items/${itemId}/image`);
  }

  /** Requiere fetch autenticado (blob), no un <img src> directo: a diferencia de las imágenes de producto, esta ruta NO es pública. */
  getItemImageBlob(itemId: number): Observable<Blob> {
    return this.http.get(`${environment.apiBaseUrl}/shipments/items/${itemId}/image/file`, { responseType: 'blob' });
  }

  uploadDocument(shipmentId: number, type: ShipmentDocumentType, file: File): Observable<ApiResponse<void>> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/${shipmentId}/documents/${type}`, form);
  }

  deleteDocument(shipmentId: number, type: ShipmentDocumentType): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${shipmentId}/documents/${type}`);
  }

  /** Igual que getItemImageBlob: no es una ruta pública, hay que traerla autenticada como blob. */
  getDocumentBlob(shipmentId: number, type: ShipmentDocumentType): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${shipmentId}/documents/${type}/file`, { responseType: 'blob' });
  }
}

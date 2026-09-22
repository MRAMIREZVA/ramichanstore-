import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { ShipmentHolder, ShipmentHolderRequest } from '../models/shipment.model';

@Injectable({ providedIn: 'root' })
export class ShipmentHolderService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/shipment-holders`;

  findAll(): Observable<ApiResponse<ShipmentHolder[]>> {
    return this.http.get<ApiResponse<ShipmentHolder[]>>(this.baseUrl);
  }

  create(request: ShipmentHolderRequest): Observable<ApiResponse<ShipmentHolder>> {
    return this.http.post<ApiResponse<ShipmentHolder>>(this.baseUrl, request);
  }

  update(id: number, request: ShipmentHolderRequest): Observable<ApiResponse<ShipmentHolder>> {
    return this.http.put<ApiResponse<ShipmentHolder>>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}

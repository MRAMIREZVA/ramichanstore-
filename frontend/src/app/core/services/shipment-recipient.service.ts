import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { ShipmentRecipient, ShipmentRecipientRequest } from '../models/shipment.model';

@Injectable({ providedIn: 'root' })
export class ShipmentRecipientService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/shipment-recipients`;

  findAll(): Observable<ApiResponse<ShipmentRecipient[]>> {
    return this.http.get<ApiResponse<ShipmentRecipient[]>>(this.baseUrl);
  }

  create(request: ShipmentRecipientRequest): Observable<ApiResponse<ShipmentRecipient>> {
    return this.http.post<ApiResponse<ShipmentRecipient>>(this.baseUrl, request);
  }

  update(id: number, request: ShipmentRecipientRequest): Observable<ApiResponse<ShipmentRecipient>> {
    return this.http.put<ApiResponse<ShipmentRecipient>>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}

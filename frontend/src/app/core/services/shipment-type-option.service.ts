import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { ShipmentTypeOption, ShipmentTypeOptionRequest } from '../models/shipment.model';

@Injectable({ providedIn: 'root' })
export class ShipmentTypeOptionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/shipment-type-options`;

  findAll(): Observable<ApiResponse<ShipmentTypeOption[]>> {
    return this.http.get<ApiResponse<ShipmentTypeOption[]>>(this.baseUrl);
  }

  create(request: ShipmentTypeOptionRequest): Observable<ApiResponse<ShipmentTypeOption>> {
    return this.http.post<ApiResponse<ShipmentTypeOption>>(this.baseUrl, request);
  }

  update(id: number, request: ShipmentTypeOptionRequest): Observable<ApiResponse<ShipmentTypeOption>> {
    return this.http.put<ApiResponse<ShipmentTypeOption>>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}

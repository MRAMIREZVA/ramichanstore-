import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { LoyaltyBalance, LoyaltyMovement, LoyaltyMovementRequest, LoyaltyMovementType } from '../models/loyalty.model';
import { PageResponse } from '../models/page-response.model';

export interface LoyaltyFilters {
  customerId?: number | null;
  type?: LoyaltyMovementType | null;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class LoyaltyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/loyalty`;

  search(filters: LoyaltyFilters): Observable<ApiResponse<PageResponse<LoyaltyMovement>>> {
    let params = new HttpParams()
      .set('page', filters.page ?? 0)
      .set('size', filters.size ?? 20);
    if (filters.customerId) params = params.set('customerId', filters.customerId);
    if (filters.type) params = params.set('type', filters.type);

    return this.http.get<ApiResponse<PageResponse<LoyaltyMovement>>>(`${this.baseUrl}/movements`, { params });
  }

  getBalance(customerId: number): Observable<ApiResponse<LoyaltyBalance>> {
    return this.http.get<ApiResponse<LoyaltyBalance>>(`${this.baseUrl}/balance/${customerId}`);
  }

  registerMovement(request: LoyaltyMovementRequest): Observable<ApiResponse<LoyaltyMovement>> {
    return this.http.post<ApiResponse<LoyaltyMovement>>(`${this.baseUrl}/movements`, request);
  }
}

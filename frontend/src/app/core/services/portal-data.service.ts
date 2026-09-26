import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PageResponse } from '../models/page-response.model';
import { Delivery } from '../models/delivery.model';
import { PortalLoyaltyBalance, PortalReservation } from '../models/portal.model';
import { Sale } from '../models/sale.model';

@Injectable({ providedIn: 'root' })
export class PortalDataService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/portal`;

  mySales(page: number, size: number): Observable<ApiResponse<PageResponse<Sale>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PageResponse<Sale>>>(`${this.baseUrl}/sales`, { params });
  }

  mySale(id: number): Observable<ApiResponse<Sale>> {
    return this.http.get<ApiResponse<Sale>>(`${this.baseUrl}/sales/${id}`);
  }

  myReservations(): Observable<ApiResponse<PortalReservation[]>> {
    return this.http.get<ApiResponse<PortalReservation[]>>(`${this.baseUrl}/reservations`);
  }

  myLoyaltyBalance(): Observable<ApiResponse<PortalLoyaltyBalance>> {
    return this.http.get<ApiResponse<PortalLoyaltyBalance>>(`${this.baseUrl}/loyalty/balance`);
  }

  myDeliveries(): Observable<ApiResponse<Delivery[]>> {
    return this.http.get<ApiResponse<Delivery[]>>(`${this.baseUrl}/deliveries`);
  }
}

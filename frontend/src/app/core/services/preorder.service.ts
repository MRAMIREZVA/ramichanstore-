import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PageResponse } from '../models/page-response.model';
import {
  CustomerReservation,
  Preorder,
  PreorderRequest,
  PreorderReservation,
  PreorderReservationPayment,
  PreorderReservationPaymentRequest,
  PreorderReservationRequest,
  PreorderStatus,
} from '../models/preorder.model';

export interface PreorderFilters {
  search?: string;
  status?: PreorderStatus | null;
  page?: number;
  size?: number;
}

export interface ReservationFilters {
  search?: string;
  status?: PreorderStatus | null;
  from?: string | null;
  to?: string | null;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class PreorderService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/preorders`;

  search(filters: PreorderFilters): Observable<ApiResponse<PageResponse<Preorder>>> {
    let params = new HttpParams()
      .set('page', filters.page ?? 0)
      .set('size', filters.size ?? 20);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);

    return this.http.get<ApiResponse<PageResponse<Preorder>>>(this.baseUrl, { params });
  }

  findById(id: number): Observable<ApiResponse<Preorder>> {
    return this.http.get<ApiResponse<Preorder>>(`${this.baseUrl}/${id}`);
  }

  create(request: PreorderRequest): Observable<ApiResponse<Preorder>> {
    return this.http.post<ApiResponse<Preorder>>(this.baseUrl, request);
  }

  update(id: number, request: PreorderRequest): Observable<ApiResponse<Preorder>> {
    return this.http.put<ApiResponse<Preorder>>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }

  listReservations(preorderId: number): Observable<ApiResponse<PreorderReservation[]>> {
    return this.http.get<ApiResponse<PreorderReservation[]>>(`${this.baseUrl}/${preorderId}/reservations`);
  }

  addReservation(
    preorderId: number,
    request: PreorderReservationRequest,
  ): Observable<ApiResponse<PreorderReservation>> {
    return this.http.post<ApiResponse<PreorderReservation>>(`${this.baseUrl}/${preorderId}/reservations`, request);
  }

  cancelReservation(preorderId: number, reservationId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${preorderId}/reservations/${reservationId}`);
  }

  listReservationsByCustomer(customerId: number): Observable<ApiResponse<CustomerReservation[]>> {
    const params = new HttpParams().set('customerId', customerId);
    return this.http.get<ApiResponse<CustomerReservation[]>>(`${this.baseUrl}/reservations`, { params });
  }

  /** Todas las reservas de todas las campañas juntas — para la pestaña "Preventas" de Pedidos. */
  searchReservations(filters: ReservationFilters): Observable<ApiResponse<PageResponse<PreorderReservation>>> {
    let params = new HttpParams()
      .set('page', filters.page ?? 0)
      .set('size', filters.size ?? 20);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);

    return this.http.get<ApiResponse<PageResponse<PreorderReservation>>>(`${this.baseUrl}/reservations/search`, { params });
  }

  listPayments(reservationId: number): Observable<ApiResponse<PreorderReservationPayment[]>> {
    return this.http.get<ApiResponse<PreorderReservationPayment[]>>(`${this.baseUrl}/reservations/${reservationId}/payments`);
  }

  registerPayment(
    reservationId: number,
    request: PreorderReservationPaymentRequest,
  ): Observable<ApiResponse<PreorderReservationPayment>> {
    return this.http.post<ApiResponse<PreorderReservationPayment>>(`${this.baseUrl}/reservations/${reservationId}/payments`, request);
  }
}

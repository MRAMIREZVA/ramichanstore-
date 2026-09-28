import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  OrderRequest,
  OrderRequestStatus,
  OrderRequestStatusInfo,
  OrderRequestSubmission,
  PublicOrderRequestInfo,
} from '../models/order-request.model';
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

  /**
   * Público (Fase 52): el cliente sube la captura de su pago con Yape. El teléfono es la
   * prueba de pertenencia — los ids de pedido son correlativos, así que sin él cualquiera
   * podría adjuntarle un comprobante al pedido de otro.
   */
  uploadVoucher(id: number, phone: string, file: File): Observable<ApiResponse<void>> {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/${id}/voucher`, body, {
      params: new HttpParams().set('phone', phone),
    });
  }

  /**
   * Admin: el comprobante NO es público, así que no sirve un <img src> directo (no manda el
   * token) — se trae como blob autenticado y se arma un objectURL, mismo patrón que las fotos
   * de artículo de Embarques (Fase 19).
   */
  getVoucherBlob(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/voucher/file`, { responseType: 'blob' });
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

  /** Solo para pedidos requestType=PREORDER — un depósito real por ítem, ver ConvertToReservationsRequest (backend). */
  convertToReservations(id: number, deposits: { itemId: number; depositAmount: number }[]): Observable<ApiResponse<OrderRequest>> {
    return this.http.post<ApiResponse<OrderRequest>>(`${this.baseUrl}/${id}/convert-to-reservations`, { deposits });
  }

  reject(id: number, reason: string): Observable<ApiResponse<OrderRequest>> {
    return this.http.post<ApiResponse<OrderRequest>>(`${this.baseUrl}/${id}/reject`, { reason });
  }

  /** Público — "Buscar mi pedido" (Fase 47), sin cuenta: exige el id que el checkout ya le mostró al cliente + su propio teléfono. */
  lookup(id: number, phone: string): Observable<ApiResponse<PublicOrderRequestInfo>> {
    const params = new HttpParams().set('id', id).set('phone', phone);
    return this.http.get<ApiResponse<PublicOrderRequestInfo>>(`${this.baseUrl}/lookup`, { params });
  }
}

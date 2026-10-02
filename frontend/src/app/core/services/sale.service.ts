import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PageResponse } from '../models/page-response.model';
import {
  AddSaleItemRequest,
  PaymentMethod,
  PaymentStatus,
  Sale,
  SalePayment,
  SalePaymentRequest,
  SaleRequest,
  SaleType,
  UpdateSaleItemsRequest,
} from '../models/sale.model';

export interface SaleFilters {
  type?: SaleType | null;
  customerId?: number | null;
  status?: PaymentStatus | null;
  method?: PaymentMethod | null;
  from?: string | null;
  to?: string | null;
  /** "Clientes que me deben" — solo PENDING/PARTIAL (nunca CANCELLED, que no es una cuenta por cobrar real). */
  pendingBalance?: boolean | null;
  page?: number;
  size?: number;
  /** ej. "saleDate,desc" — el backend acepta el formato estándar de Spring Data sin necesidad de un endpoint aparte. */
  sort?: string;
}

@Injectable({ providedIn: 'root' })
export class SaleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/sales`;

  search(filters: SaleFilters): Observable<ApiResponse<PageResponse<Sale>>> {
    let params = new HttpParams()
      .set('page', filters.page ?? 0)
      .set('size', filters.size ?? 20);
    if (filters.type) params = params.set('type', filters.type);
    if (filters.customerId) params = params.set('customerId', filters.customerId);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.method) params = params.set('method', filters.method);
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);
    if (filters.pendingBalance) params = params.set('pendingBalance', true);
    if (filters.sort) params = params.set('sort', filters.sort);

    return this.http.get<ApiResponse<PageResponse<Sale>>>(this.baseUrl, { params });
  }

  findById(id: number): Observable<ApiResponse<Sale>> {
    return this.http.get<ApiResponse<Sale>>(`${this.baseUrl}/${id}`);
  }

  create(request: SaleRequest): Observable<ApiResponse<Sale>> {
    return this.http.post<ApiResponse<Sale>>(this.baseUrl, request);
  }

  cancel(id: number, reason: string): Observable<ApiResponse<Sale>> {
    return this.http.post<ApiResponse<Sale>>(`${this.baseUrl}/${id}/cancel`, { reason });
  }

  /** Solo aplica a type=VENTA — para type=SEPARACION el estado se deriva del ledger de abonos. */
  updatePaymentStatus(id: number, status: PaymentStatus): Observable<ApiResponse<Sale>> {
    return this.http.put<ApiResponse<Sale>>(`${this.baseUrl}/${id}/payment-status`, { status });
  }

  /** Corrige la fecha en la que se realizó la compra — aplica a ambos tipos por igual. */
  updateSaleDate(id: number, saleDate: string): Observable<ApiResponse<Sale>> {
    return this.http.put<ApiResponse<Sale>>(`${this.baseUrl}/${id}/sale-date`, { saleDate });
  }

  /** Corrige precio unitario/descuento de líneas ya creadas — recalcula total/ganancia/puntos. */
  updateItems(id: number, request: UpdateSaleItemsRequest): Observable<ApiResponse<Sale>> {
    return this.http.put<ApiResponse<Sale>>(`${this.baseUrl}/${id}/items`, request);
  }

  /** Agrega un producto nuevo a una venta ya creada — a diferencia de updateItems, sí descuenta stock. */
  addItem(id: number, request: AddSaleItemRequest): Observable<ApiResponse<Sale>> {
    return this.http.post<ApiResponse<Sale>>(`${this.baseUrl}/${id}/items`, request);
  }

  // ---- Ledger de abonos (solo aplica a type=SEPARACION) ----

  listPayments(saleId: number): Observable<ApiResponse<SalePayment[]>> {
    return this.http.get<ApiResponse<SalePayment[]>>(`${this.baseUrl}/${saleId}/payments`);
  }

  registerPayment(saleId: number, request: SalePaymentRequest): Observable<ApiResponse<SalePayment>> {
    return this.http.post<ApiResponse<SalePayment>>(`${this.baseUrl}/${saleId}/payments`, request);
  }

  updatePayment(saleId: number, paymentId: number, request: SalePaymentRequest): Observable<ApiResponse<SalePayment>> {
    return this.http.put<ApiResponse<SalePayment>>(`${this.baseUrl}/${saleId}/payments/${paymentId}`, request);
  }

  deletePayment(saleId: number, paymentId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${saleId}/payments/${paymentId}`);
  }
}

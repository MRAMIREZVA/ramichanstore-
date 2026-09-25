import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { FormTokenResponse } from '../models/payment.model';

/**
 * Pago con Yape en el checkout (vía Izipay, Fase 37) — `POST /api/payments/izipay/form-token` es
 * público a propósito, lo llama el propio checkout sin login (ver SecurityConfig).
 */
@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/payments/izipay`;

  createFormToken(orderRequestId: number): Observable<ApiResponse<FormTokenResponse>> {
    return this.http.post<ApiResponse<FormTokenResponse>>(`${this.base}/form-token`, { orderRequestId });
  }

  /**
   * Verificación instantánea del lado del cliente apenas el widget termina el intento de pago
   * (`KR.onSubmit`) — solo para UX optimista, NUNCA la fuente de verdad (esa es la IPN del backend).
   */
  validate(krAnswer: string, krHash: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.base}/validate`, { krAnswer, krHash });
  }
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Customer, CustomerRequest, CustomerStatus } from '../models/customer.model';
import { PageResponse } from '../models/page-response.model';

export interface CustomerFilters {
  search?: string;
  status?: CustomerStatus | null;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/customers`;

  search(filters: CustomerFilters): Observable<ApiResponse<PageResponse<Customer>>> {
    let params = new HttpParams()
      .set('page', filters.page ?? 0)
      .set('size', filters.size ?? 20);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);

    return this.http.get<ApiResponse<PageResponse<Customer>>>(this.baseUrl, { params });
  }

  findById(id: number): Observable<ApiResponse<Customer>> {
    return this.http.get<ApiResponse<Customer>>(`${this.baseUrl}/${id}`);
  }

  create(request: CustomerRequest): Observable<ApiResponse<Customer>> {
    return this.http.post<ApiResponse<Customer>>(this.baseUrl, request);
  }

  update(id: number, request: CustomerRequest): Observable<ApiResponse<Customer>> {
    return this.http.put<ApiResponse<Customer>>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }

  enablePortalAccess(id: number, username: string, password: string): Observable<ApiResponse<Customer>> {
    return this.http.post<ApiResponse<Customer>>(`${this.baseUrl}/${id}/portal-access`, { username, password });
  }

  resetPortalPassword(id: number, newPassword: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/${id}/portal-access/reset-password`, { newPassword });
  }

  disablePortalAccess(id: number): Observable<ApiResponse<Customer>> {
    return this.http.delete<ApiResponse<Customer>>(`${this.baseUrl}/${id}/portal-access`);
  }
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PageResponse } from '../models/page-response.model';
import { Product, ProductRequest, ProductStatus } from '../models/product.model';

export interface ProductFilters {
  search?: string;
  categoryId?: number | null;
  brandId?: number | null;
  status?: ProductStatus | null;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/products`;

  search(filters: ProductFilters): Observable<ApiResponse<PageResponse<Product>>> {
    let params = new HttpParams()
      .set('page', filters.page ?? 0)
      .set('size', filters.size ?? 20);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.categoryId) params = params.set('categoryId', filters.categoryId);
    if (filters.brandId) params = params.set('brandId', filters.brandId);
    if (filters.status) params = params.set('status', filters.status);

    return this.http.get<ApiResponse<PageResponse<Product>>>(this.baseUrl, { params });
  }

  findById(id: number): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${this.baseUrl}/${id}`);
  }

  create(request: ProductRequest): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(this.baseUrl, request);
  }

  update(id: number, request: ProductRequest): Observable<ApiResponse<Product>> {
    return this.http.put<ApiResponse<Product>>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PageResponse } from '../models/page-response.model';
import { CatalogFilterOption, PublicProduct, StoreInfo } from '../models/public-catalog.model';

export interface PublicCatalogFilters {
  search?: string;
  categoryId?: number | null;
  brandId?: number | null;
  franchise?: string | null;
  onlyPreorder?: boolean;
  page?: number;
  size?: number;
}

/**
 * Cliente del catálogo público (`/api/catalog`, sin autenticación). Usado por
 * la vitrina pública (`features/catalog`) — nunca por las pantallas admin, que
 * siguen usando ProductService contra `/api/products`.
 */
@Injectable({ providedIn: 'root' })
export class PublicCatalogService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/catalog`;

  searchProducts(filters: PublicCatalogFilters): Observable<ApiResponse<PageResponse<PublicProduct>>> {
    let params = new HttpParams()
      .set('page', filters.page ?? 0)
      .set('size', filters.size ?? 24);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.categoryId) params = params.set('categoryId', filters.categoryId);
    if (filters.brandId) params = params.set('brandId', filters.brandId);
    if (filters.franchise) params = params.set('franchise', filters.franchise);
    if (filters.onlyPreorder) params = params.set('onlyPreorder', filters.onlyPreorder);

    return this.http.get<ApiResponse<PageResponse<PublicProduct>>>(`${this.base}/products`, { params });
  }

  findProductById(id: number): Observable<ApiResponse<PublicProduct>> {
    return this.http.get<ApiResponse<PublicProduct>>(`${this.base}/products/${id}`);
  }

  getCategories(): Observable<ApiResponse<CatalogFilterOption[]>> {
    return this.http.get<ApiResponse<CatalogFilterOption[]>>(`${this.base}/categories`);
  }

  getBrands(): Observable<ApiResponse<CatalogFilterOption[]>> {
    return this.http.get<ApiResponse<CatalogFilterOption[]>>(`${this.base}/brands`);
  }

  getStoreInfo(): Observable<ApiResponse<StoreInfo>> {
    return this.http.get<ApiResponse<StoreInfo>>(`${this.base}/store-info`);
  }

  getFranchises(): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.base}/franchises`);
  }
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { InventoryMovement, InventoryMovementRequest, MovementType } from '../models/inventory.model';
import { PageResponse } from '../models/page-response.model';
import { Product } from '../models/product.model';

export interface InventoryFilters {
  productId?: number | null;
  type?: MovementType | null;
  from?: string | null;
  to?: string | null;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/inventory`;

  search(filters: InventoryFilters): Observable<ApiResponse<PageResponse<InventoryMovement>>> {
    let params = new HttpParams()
      .set('page', filters.page ?? 0)
      .set('size', filters.size ?? 20);
    if (filters.productId) params = params.set('productId', filters.productId);
    if (filters.type) params = params.set('type', filters.type);
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);

    return this.http.get<ApiResponse<PageResponse<InventoryMovement>>>(`${this.baseUrl}/movements`, { params });
  }

  lowStock(): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(`${this.baseUrl}/low-stock`);
  }

  registerMovement(request: InventoryMovementRequest): Observable<ApiResponse<InventoryMovement>> {
    return this.http.post<ApiResponse<InventoryMovement>>(`${this.baseUrl}/movements`, request);
  }
}

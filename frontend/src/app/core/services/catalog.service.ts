import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Brand, Category, ProductLine, Supplier } from '../models/catalog.model';

/** Catálogos de apoyo para el módulo de Productos (categorías, marcas, líneas, proveedores). */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  getCategories(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(`${this.base}/categories`);
  }

  getBrands(): Observable<ApiResponse<Brand[]>> {
    return this.http.get<ApiResponse<Brand[]>>(`${this.base}/brands`);
  }

  getProductLines(): Observable<ApiResponse<ProductLine[]>> {
    return this.http.get<ApiResponse<ProductLine[]>>(`${this.base}/product-lines`);
  }

  getSuppliers(): Observable<ApiResponse<Supplier[]>> {
    return this.http.get<ApiResponse<Supplier[]>>(`${this.base}/suppliers`);
  }
}

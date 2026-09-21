import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  Brand,
  Category,
  NameDescriptionRequest,
  ProductLine,
  ProductLineRequest,
  Supplier,
  SupplierRequest,
} from '../models/catalog.model';

/** Catálogos de apoyo para el módulo de Productos (categorías, marcas, líneas, proveedores). */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  getCategories(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(`${this.base}/categories`);
  }

  createCategory(request: NameDescriptionRequest): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>(`${this.base}/categories`, request);
  }

  updateCategory(id: number, request: NameDescriptionRequest): Observable<ApiResponse<Category>> {
    return this.http.put<ApiResponse<Category>>(`${this.base}/categories/${id}`, request);
  }

  deleteCategory(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/categories/${id}`);
  }

  getBrands(): Observable<ApiResponse<Brand[]>> {
    return this.http.get<ApiResponse<Brand[]>>(`${this.base}/brands`);
  }

  createBrand(request: NameDescriptionRequest): Observable<ApiResponse<Brand>> {
    return this.http.post<ApiResponse<Brand>>(`${this.base}/brands`, request);
  }

  updateBrand(id: number, request: NameDescriptionRequest): Observable<ApiResponse<Brand>> {
    return this.http.put<ApiResponse<Brand>>(`${this.base}/brands/${id}`, request);
  }

  deleteBrand(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/brands/${id}`);
  }

  getProductLines(): Observable<ApiResponse<ProductLine[]>> {
    return this.http.get<ApiResponse<ProductLine[]>>(`${this.base}/product-lines`);
  }

  createProductLine(request: ProductLineRequest): Observable<ApiResponse<ProductLine>> {
    return this.http.post<ApiResponse<ProductLine>>(`${this.base}/product-lines`, request);
  }

  updateProductLine(id: number, request: ProductLineRequest): Observable<ApiResponse<ProductLine>> {
    return this.http.put<ApiResponse<ProductLine>>(`${this.base}/product-lines/${id}`, request);
  }

  deleteProductLine(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/product-lines/${id}`);
  }

  getSuppliers(): Observable<ApiResponse<Supplier[]>> {
    return this.http.get<ApiResponse<Supplier[]>>(`${this.base}/suppliers`);
  }

  createSupplier(request: SupplierRequest): Observable<ApiResponse<Supplier>> {
    return this.http.post<ApiResponse<Supplier>>(`${this.base}/suppliers`, request);
  }

  updateSupplier(id: number, request: SupplierRequest): Observable<ApiResponse<Supplier>> {
    return this.http.put<ApiResponse<Supplier>>(`${this.base}/suppliers/${id}`, request);
  }

  deleteSupplier(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/suppliers/${id}`);
  }

  uploadCatalogBanner(file: File): Observable<ApiResponse<void>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<void>>(`${this.base}/catalog/banner`, formData);
  }

  deleteCatalogBanner(): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/catalog/banner`);
  }
}

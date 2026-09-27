import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Complaint, ComplaintStatus, ComplaintSubmission, ComplaintType, RespondComplaintRequest } from '../models/complaint.model';
import { PageResponse } from '../models/page-response.model';

export interface ComplaintFilters {
  type?: ComplaintType | null;
  status?: ComplaintStatus | null;
  from?: string | null;
  to?: string | null;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class ComplaintService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/complaints`;

  /** Público — sin token, lo llama el formulario público del Libro de Reclamaciones. */
  submit(request: ComplaintSubmission): Observable<ApiResponse<Complaint>> {
    return this.http.post<ApiResponse<Complaint>>(this.baseUrl, request);
  }

  search(filters: ComplaintFilters): Observable<ApiResponse<PageResponse<Complaint>>> {
    let params = new HttpParams()
      .set('page', filters.page ?? 0)
      .set('size', filters.size ?? 20);
    if (filters.type) params = params.set('type', filters.type);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);
    return this.http.get<ApiResponse<PageResponse<Complaint>>>(this.baseUrl, { params });
  }

  findById(id: number): Observable<ApiResponse<Complaint>> {
    return this.http.get<ApiResponse<Complaint>>(`${this.baseUrl}/${id}`);
  }

  respond(id: number, request: RespondComplaintRequest): Observable<ApiResponse<Complaint>> {
    return this.http.post<ApiResponse<Complaint>>(`${this.baseUrl}/${id}/respond`, request);
  }
}

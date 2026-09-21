import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AuditAction, AuditLogEntry } from '../models/audit.model';
import { PageResponse } from '../models/page-response.model';

export interface AuditFilters {
  module?: string | null;
  action?: AuditAction | null;
  username?: string | null;
  from?: string | null;
  to?: string | null;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/audit`;

  search(filters: AuditFilters): Observable<ApiResponse<PageResponse<AuditLogEntry>>> {
    let params = new HttpParams()
      .set('page', filters.page ?? 0)
      .set('size', filters.size ?? 30);
    if (filters.module) params = params.set('module', filters.module);
    if (filters.action) params = params.set('action', filters.action);
    if (filters.username) params = params.set('username', filters.username);
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);

    return this.http.get<ApiResponse<PageResponse<AuditLogEntry>>>(this.baseUrl, { params });
  }
}

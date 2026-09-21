import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Setting } from '../models/setting.model';

@Injectable({ providedIn: 'root' })
export class SettingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/settings`;

  findAll(): Observable<ApiResponse<Setting[]>> {
    return this.http.get<ApiResponse<Setting[]>>(this.baseUrl);
  }

  updateValue(key: string, value: string): Observable<ApiResponse<Setting>> {
    return this.http.put<ApiResponse<Setting>>(`${this.baseUrl}/${key}`, { value });
  }
}

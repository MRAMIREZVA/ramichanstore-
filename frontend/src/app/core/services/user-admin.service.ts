import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AppUser, Permission, Role, RoleRequest, UserCreateRequest, UserUpdateRequest } from '../models/user-admin.model';

@Injectable({ providedIn: 'root' })
export class UserAdminService {
  private readonly http = inject(HttpClient);
  private readonly usersUrl = `${environment.apiBaseUrl}/users`;
  private readonly rolesUrl = `${environment.apiBaseUrl}/roles`;
  private readonly permissionsUrl = `${environment.apiBaseUrl}/permissions`;

  findAllUsers(): Observable<ApiResponse<AppUser[]>> {
    return this.http.get<ApiResponse<AppUser[]>>(this.usersUrl);
  }

  createUser(request: UserCreateRequest): Observable<ApiResponse<AppUser>> {
    return this.http.post<ApiResponse<AppUser>>(this.usersUrl, request);
  }

  updateUser(id: number, request: UserUpdateRequest): Observable<ApiResponse<AppUser>> {
    return this.http.put<ApiResponse<AppUser>>(`${this.usersUrl}/${id}`, request);
  }

  resetPassword(id: number, newPassword: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.usersUrl}/${id}/reset-password`, { newPassword });
  }

  deleteUser(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.usersUrl}/${id}`);
  }

  findAllRoles(): Observable<ApiResponse<Role[]>> {
    return this.http.get<ApiResponse<Role[]>>(this.rolesUrl);
  }

  findAllPermissions(): Observable<ApiResponse<Permission[]>> {
    return this.http.get<ApiResponse<Permission[]>>(this.permissionsUrl);
  }

  createRole(request: RoleRequest): Observable<ApiResponse<Role>> {
    return this.http.post<ApiResponse<Role>>(this.rolesUrl, request);
  }

  updateRole(id: number, request: RoleRequest): Observable<ApiResponse<Role>> {
    return this.http.put<ApiResponse<Role>>(`${this.rolesUrl}/${id}`, request);
  }

  deleteRole(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.rolesUrl}/${id}`);
  }
}

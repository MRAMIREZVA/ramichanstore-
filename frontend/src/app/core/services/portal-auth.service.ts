import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PortalLoginRequest, PortalLoginResponse } from '../models/portal.model';
import { PortalTokenStorageService } from './portal-token-storage.service';

@Injectable({ providedIn: 'root' })
export class PortalAuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(PortalTokenStorageService);
  private readonly router = inject(Router);

  private readonly currentCustomerSignal = signal(this.tokenStorage.getCustomer());

  readonly currentCustomer = this.currentCustomerSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentCustomerSignal() !== null && !!this.tokenStorage.getAccessToken());

  login(request: PortalLoginRequest): Observable<ApiResponse<PortalLoginResponse>> {
    return this.http.post<ApiResponse<PortalLoginResponse>>(`${environment.apiBaseUrl}/portal/auth/login`, request).pipe(
      tap((response) => {
        const { accessToken, refreshToken, customer } = response.data;
        this.tokenStorage.setSession(accessToken, refreshToken, customer);
        this.currentCustomerSignal.set(customer);
      }),
    );
  }

  logout(): void {
    this.tokenStorage.clear();
    this.currentCustomerSignal.set(null);
    this.router.navigate(['/portal/login']);
  }
}

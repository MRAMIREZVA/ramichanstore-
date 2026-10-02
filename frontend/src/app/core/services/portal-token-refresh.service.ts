import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, finalize, map, shareReplay, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PortalLoginResponse } from '../models/portal.model';
import { SILENT_ERROR } from '../http/http-context-tokens';
import { PortalAuthService } from './portal-auth.service';
import { PortalTokenStorageService } from './portal-token-storage.service';

/**
 * Equivalente de TokenRefreshService para el portal de clientes (Fase 75) — storage y
 * endpoint propios, mismo criterio de aislamiento ya aplicado al resto de auth del portal
 * (ver PortalTokenStorageService/PortalAuthService).
 */
@Injectable({ providedIn: 'root' })
export class PortalTokenRefreshService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(PortalTokenStorageService);
  private readonly portalAuthService = inject(PortalAuthService);

  private refreshing$: Observable<string> | null = null;

  refreshAccessToken(): Observable<string> {
    const refreshToken = this.tokenStorage.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No hay refresh token disponible'));
    }

    if (!this.refreshing$) {
      this.refreshing$ = this.http
        .post<ApiResponse<PortalLoginResponse>>(
          `${environment.apiBaseUrl}/portal/auth/refresh`,
          { refreshToken },
          { context: new HttpContext().set(SILENT_ERROR, true) },
        )
        .pipe(
          map((res) => res.data),
          tap(({ accessToken, refreshToken: newRefreshToken, customer }) => {
            this.tokenStorage.setSession(accessToken, newRefreshToken, customer);
            this.portalAuthService.syncFromStorage();
          }),
          map(({ accessToken }) => accessToken),
          shareReplay(1),
          finalize(() => {
            this.refreshing$ = null;
          }),
        );
    }
    return this.refreshing$;
  }
}

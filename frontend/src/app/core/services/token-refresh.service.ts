import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, finalize, map, shareReplay, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { LoginResponse } from '../models/auth.model';
import { SILENT_ERROR } from '../http/http-context-tokens';
import { AuthService } from './auth.service';
import { TokenStorageService } from './token-storage.service';

/**
 * Renueva el access token del panel admin usando el refresh token ya guardado — sin
 * pasar por AuthService.login() (Fase 75). Deduplica refrescos concurrentes: si 2+
 * requests dan 401 casi a la vez (ej. el Dashboard dispara varias llamadas juntas),
 * todas comparten el mismo POST /auth/refresh en vuelo en vez de disparar uno cada una
 * (ver `errorInterceptor`, el único consumidor real de este servicio).
 */
@Injectable({ providedIn: 'root' })
export class TokenRefreshService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly authService = inject(AuthService);

  private refreshing$: Observable<string> | null = null;

  refreshAccessToken(): Observable<string> {
    const refreshToken = this.tokenStorage.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No hay refresh token disponible'));
    }

    if (!this.refreshing$) {
      this.refreshing$ = this.http
        .post<ApiResponse<LoginResponse>>(
          `${environment.apiBaseUrl}/auth/refresh`,
          { refreshToken },
          { context: new HttpContext().set(SILENT_ERROR, true) },
        )
        .pipe(
          map((res) => res.data),
          tap(({ accessToken, refreshToken: newRefreshToken, user }) => {
            this.tokenStorage.setSession(accessToken, newRefreshToken, user);
            this.authService.syncFromStorage();
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

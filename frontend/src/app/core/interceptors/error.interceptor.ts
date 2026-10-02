import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SILENT_ERROR } from '../http/http-context-tokens';
import { AuthService } from '../services/auth.service';
import { PortalAuthService } from '../services/portal-auth.service';
import { PortalTokenRefreshService } from '../services/portal-token-refresh.service';
import { PortalTokenStorageService } from '../services/portal-token-storage.service';
import { TokenRefreshService } from '../services/token-refresh.service';
import { TokenStorageService } from '../services/token-storage.service';

/**
 * Fase 75: antes, CUALQUIER 401 cerraba la sesión de inmediato — con el access token
 * durando 1h por defecto, cualquier usuario con la pestaña abierta más de eso se
 * encontraba deslogueado en plena acción, sin aviso. Ahora, un 401 (salvo en los propios
 * endpoints de login/refresh, para no entrar en loop) primero intenta renovar en silencio
 * con el refresh token ya guardado (`TokenRefreshService`/`PortalTokenRefreshService`,
 * que dedupean refrescos concurrentes) y reintenta la request original UNA vez con el
 * access token nuevo — recién si el refresh mismo falla (refresh token también vencido,
 * ~7 días) se cierra la sesión de verdad.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);
  const authService = inject(AuthService);
  const portalAuthService = inject(PortalAuthService);
  const tokenRefresh = inject(TokenRefreshService);
  const portalTokenRefresh = inject(PortalTokenRefreshService);
  const tokenStorage = inject(TokenStorageService);
  const portalTokenStorage = inject(PortalTokenStorageService);
  const isPortalRequest = req.url.startsWith(`${environment.apiBaseUrl}/portal`);
  const isAuthEndpoint =
    req.url.endsWith('/auth/login') ||
    req.url.endsWith('/auth/refresh') ||
    req.url.endsWith('/portal/auth/login') ||
    req.url.endsWith('/portal/auth/refresh');

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      if (req.context.get(SILENT_ERROR)) {
        return throwError(() => error);
      }

      if (error.status === 401 && !isAuthEndpoint) {
        const storage = isPortalRequest ? portalTokenStorage : tokenStorage;
        const refreshService = isPortalRequest ? portalTokenRefresh : tokenRefresh;

        if (storage.getRefreshToken()) {
          return refreshService.refreshAccessToken().pipe(
            switchMap((newAccessToken) =>
              next(req.clone({ setHeaders: { Authorization: `Bearer ${newAccessToken}` } })),
            ),
            catchError(() => {
              // El refresh falló (el refresh token también venció) o la reintentada volvió a
              // dar 401 — ahí sí se perdió la sesión de verdad.
              isPortalRequest ? portalAuthService.logout() : authService.logout();
              snackBar.open('Tu sesión expiró. Vuelve a iniciar sesión.', 'Cerrar', { duration: 5000 });
              return throwError(() => error);
            }),
          );
        }

        // Nunca tuvo refresh token (ej. ya estaba deslogueado) — cierra sesión directo.
        isPortalRequest ? portalAuthService.logout() : authService.logout();
      }

      const message = error.error?.message ?? 'Ocurrió un error al comunicarse con el servidor.';
      snackBar.open(message, 'Cerrar', { duration: 5000 });
      return throwError(() => error);
    }),
  );
};

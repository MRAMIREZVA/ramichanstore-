import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { PortalAuthService } from '../services/portal-auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);
  const authService = inject(AuthService);
  const portalAuthService = inject(PortalAuthService);
  const isPortalRequest = req.url.startsWith(`${environment.apiBaseUrl}/portal`);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const isLoginRequest = req.url.endsWith('/auth/login');
        if (error.status === 401 && !isLoginRequest) {
          // Una sesión de cliente vencida no debe cerrar la sesión de admin (y viceversa) — son
          // dos storages y dos guards independientes; cada 401 se resuelve en su propio ámbito.
          isPortalRequest ? portalAuthService.logout() : authService.logout();
        }

        const message = error.error?.message ?? 'Ocurrió un error al comunicarse con el servidor.';
        snackBar.open(message, 'Cerrar', { duration: 5000 });
      }
      return throwError(() => error);
    }),
  );
};

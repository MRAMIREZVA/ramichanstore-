import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const isLoginRequest = req.url.endsWith('/auth/login');
        if (error.status === 401 && !isLoginRequest) {
          authService.logout();
        }

        const message = error.error?.message ?? 'Ocurrió un error al comunicarse con el servidor.';
        snackBar.open(message, 'Cerrar', { duration: 5000 });
      }
      return throwError(() => error);
    }),
  );
};

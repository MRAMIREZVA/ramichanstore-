import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { TokenStorageService } from '../services/token-storage.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  // Las llamadas a /api/portal llevan el token del cliente (ver portalJwtInterceptor), no el de staff.
  if (!req.url.startsWith(environment.apiBaseUrl) || req.url.startsWith(`${environment.apiBaseUrl}/portal`)) {
    return next(req);
  }

  const token = inject(TokenStorageService).getAccessToken();
  if (!token) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { PortalTokenStorageService } from '../services/portal-token-storage.service';

/** Adjunta el token del portal SOLO en llamadas a /api/portal (nunca al resto de la API admin). */
export const portalJwtInterceptor: HttpInterceptorFn = (req, next) => {
  const portalPrefix = `${environment.apiBaseUrl}/portal`;
  if (!req.url.startsWith(portalPrefix) || req.url.startsWith(`${portalPrefix}/auth/`)) {
    return next(req);
  }

  const token = inject(PortalTokenStorageService).getAccessToken();
  if (!token) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};

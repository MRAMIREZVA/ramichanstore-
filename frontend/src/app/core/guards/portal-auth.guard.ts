import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PortalAuthService } from '../services/portal-auth.service';

export const portalAuthGuard: CanActivateFn = (_route, state) => {
  const portalAuthService = inject(PortalAuthService);
  const router = inject(Router);

  if (portalAuthService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/portal/login'], { queryParams: { returnUrl: state.url } });
};

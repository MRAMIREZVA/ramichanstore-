import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Bloquea entrar a una ruta por URL directa aunque el sidebar ya la oculte (Fase 75) —
 * el sidebar es solo UX, esto es la defensa real: sin esto, un rol sin PERM_SHIPMENT_VIEW
 * podía escribir `/embarques` a mano y la pantalla cargaba igual (solo para romperse con
 * puros 403 al pedir datos). Basta con UNO de los códigos listados, mismo criterio ANY-of
 * que ya usa `NavItem.permissions` — de hecho, cada ruta pasa exactamente la misma lista
 * que su `NavItem` en `nav-items.ts`.
 */
export function permissionGuard(...codes: string[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (codes.some((code) => authService.hasPermission(code))) {
      return true;
    }

    return router.createUrlTree(['/dashboard']);
  };
}

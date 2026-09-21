import { Injectable } from '@angular/core';
import { PortalCustomer } from '../models/portal.model';

const ACCESS_TOKEN_KEY = 'ramichan_portal_access_token';
const REFRESH_TOKEN_KEY = 'ramichan_portal_refresh_token';
const CUSTOMER_KEY = 'ramichan_portal_customer';

/**
 * Almacenamiento separado del admin (TokenStorageService): claves de
 * localStorage distintas para que una sesión de staff y una de cliente
 * puedan convivir sin pisarse el token entre sí.
 */
@Injectable({ providedIn: 'root' })
export class PortalTokenStorageService {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  getCustomer(): PortalCustomer | null {
    const raw = localStorage.getItem(CUSTOMER_KEY);
    return raw ? (JSON.parse(raw) as PortalCustomer) : null;
  }

  setSession(accessToken: string, refreshToken: string, customer: PortalCustomer): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
  }

  clear(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(CUSTOMER_KEY);
  }
}

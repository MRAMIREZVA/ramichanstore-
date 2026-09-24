import { Injectable } from '@angular/core';
import { PortalCustomer } from '../models/portal.model';

const ACCESS_TOKEN_KEY = 'ramichan_portal_access_token';
const REFRESH_TOKEN_KEY = 'ramichan_portal_refresh_token';
const CUSTOMER_KEY = 'ramichan_portal_customer';

/**
 * Almacenamiento separado del admin (TokenStorageService): claves de
 * localStorage distintas para que una sesión de staff y una de cliente
 * puedan convivir sin pisarse el token entre sí.
 *
 * Guarda también una copia en memoria como respaldo: si el navegador bloquea
 * localStorage (modo incógnito estricto, el navegador embebido de WhatsApp,
 * storage lleno, etc.), `localStorage.setItem` lanza una excepción que no es
 * un error HTTP — el interceptor global de errores nunca la ve, así que sin
 * este respaldo el login terminaba en "no pasa nada" (el POST de login sí
 * tenía éxito, pero PortalAuthService.login() nunca completaba porque
 * setSession() explotaba a mitad de camino). Con el respaldo en memoria, la
 * sesión funciona igual dentro de esa misma pestaña aunque no sobreviva a un
 * refresh si el navegador de verdad bloquea todo el storage.
 */
@Injectable({ providedIn: 'root' })
export class PortalTokenStorageService {
  private memoryAccessToken: string | null = null;
  private memoryRefreshToken: string | null = null;
  private memoryCustomer: PortalCustomer | null = null;

  getAccessToken(): string | null {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY) ?? this.memoryAccessToken;
    } catch {
      return this.memoryAccessToken;
    }
  }

  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY) ?? this.memoryRefreshToken;
    } catch {
      return this.memoryRefreshToken;
    }
  }

  getCustomer(): PortalCustomer | null {
    try {
      const raw = localStorage.getItem(CUSTOMER_KEY);
      return raw ? (JSON.parse(raw) as PortalCustomer) : this.memoryCustomer;
    } catch {
      return this.memoryCustomer;
    }
  }

  setSession(accessToken: string, refreshToken: string, customer: PortalCustomer): void {
    this.memoryAccessToken = accessToken;
    this.memoryRefreshToken = refreshToken;
    this.memoryCustomer = customer;
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
    } catch {
      // Sigue funcionando con el respaldo en memoria de arriba — ver comentario de la clase.
    }
  }

  clear(): void {
    this.memoryAccessToken = null;
    this.memoryRefreshToken = null;
    this.memoryCustomer = null;
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(CUSTOMER_KEY);
    } catch {
      // Nada que limpiar si nunca se pudo escribir.
    }
  }
}

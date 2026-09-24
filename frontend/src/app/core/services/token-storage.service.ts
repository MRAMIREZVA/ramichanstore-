import { Injectable } from '@angular/core';
import { CurrentUser } from '../models/user.model';

const ACCESS_TOKEN_KEY = 'ramichan_access_token';
const REFRESH_TOKEN_KEY = 'ramichan_refresh_token';
const USER_KEY = 'ramichan_user';

/**
 * Envuelve localStorage para persistir la sesión entre recargas de página.
 * Aislado en un servicio para poder cambiar de estrategia de almacenamiento
 * sin tocar AuthService.
 *
 * Guarda también una copia en memoria como respaldo: si el navegador bloquea
 * localStorage (modo incógnito estricto, storage lleno, etc.), `setItem`
 * lanza una excepción que no es un error HTTP — el interceptor global de
 * errores nunca la ve, así que sin este respaldo el login terminaba en "no
 * pasa nada" (mismo bug encontrado y corregido en PortalTokenStorageService,
 * el equivalente del portal de clientes — ver su comentario de clase). Con
 * el respaldo, la sesión funciona igual dentro de esa misma pestaña aunque
 * no sobreviva a un refresh si el navegador de verdad bloquea todo el storage.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private memoryAccessToken: string | null = null;
  private memoryRefreshToken: string | null = null;
  private memoryUser: CurrentUser | null = null;

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

  getUser(): CurrentUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as CurrentUser) : this.memoryUser;
    } catch {
      return this.memoryUser;
    }
  }

  setSession(accessToken: string, refreshToken: string, user: CurrentUser): void {
    this.memoryAccessToken = accessToken;
    this.memoryRefreshToken = refreshToken;
    this.memoryUser = user;
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      // Sigue funcionando con el respaldo en memoria de arriba — ver comentario de la clase.
    }
  }

  clear(): void {
    this.memoryAccessToken = null;
    this.memoryRefreshToken = null;
    this.memoryUser = null;
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      // Nada que limpiar si nunca se pudo escribir.
    }
  }
}

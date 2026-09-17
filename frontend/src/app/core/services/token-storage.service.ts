import { Injectable } from '@angular/core';
import { CurrentUser } from '../models/user.model';

const ACCESS_TOKEN_KEY = 'ramichan_access_token';
const REFRESH_TOKEN_KEY = 'ramichan_refresh_token';
const USER_KEY = 'ramichan_user';

/**
 * Envuelve localStorage para persistir la sesión entre recargas de página.
 * Aislado en un servicio para poder cambiar de estrategia de almacenamiento
 * sin tocar AuthService.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  getUser(): CurrentUser | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as CurrentUser) : null;
  }

  setSession(accessToken: string, refreshToken: string, user: CurrentUser): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  clear(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

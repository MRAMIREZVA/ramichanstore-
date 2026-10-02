import { HttpContextToken } from '@angular/common/http';

/**
 * Marca una request para que `errorInterceptor` nunca le muestre su propio snackbar de
 * error — el llamador ya decide qué mostrar (o prefiere no mostrar nada). Usado por
 * TokenRefreshService/PortalTokenRefreshService (Fase 75): si el refresh token mismo ya
 * venció, su propio POST /auth/refresh falla con un mensaje técnico ("Refresh token
 * inválido o expirado") que no debe duplicarse con el "Tu sesión expiró..." que ya
 * muestra el flujo que lo llamó.
 */
export const SILENT_ERROR = new HttpContextToken<boolean>(() => false);

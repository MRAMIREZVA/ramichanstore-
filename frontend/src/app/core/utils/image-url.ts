import { environment } from '../../../environments/environment';

/** Antepone el origen del backend a una ruta de imagen relativa devuelta por la API (ej. /api/products/images/5/file). */
export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${environment.serverOrigin}${url}`;
}

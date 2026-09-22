/** Fecha local (sin hora) a "YYYY-MM-DD" para mandar como query param — evita el corrimiento de zona horaria de toISOString(). */
export function toIsoDate(date: Date | null): string | null {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convierte un "YYYY-MM-DD" (LocalDate del backend) a un Date a medianoche LOCAL.
 * Nunca usar `new Date(isoString)` directo para esto: ese constructor interpreta un
 * string sin hora como medianoche UTC, y en cualquier zona horaria con offset negativo
 * (ej. Perú, UTC-5) los getters locales (getDate/getMonth/getFullYear) devuelven el día
 * anterior — bug real encontrado en producción: cada vez que se abría y guardaba un
 * formulario con una fecha precargada (sin tocarla), la fecha se corría un día hacia
 * atrás. Usar siempre este helper para precargar un FormControl de fecha desde datos
 * del backend, nunca `new Date(fecha)` a secas.
 */
export function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

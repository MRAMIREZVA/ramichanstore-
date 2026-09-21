/** Fecha local (sin hora) a "YYYY-MM-DD" para mandar como query param — evita el corrimiento de zona horaria de toISOString(). */
export function toIsoDate(date: Date | null): string | null {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

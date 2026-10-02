export interface NavItem {
  label: string;
  icon: string;
  route: string;
  available: boolean;
  /** Fase del roadmap (ver CLAUDE.md) en la que este módulo estará disponible. */
  phase?: number;
  /**
   * Códigos de permiso (sin el prefijo `PERM_`, ver `AuthService.hasPermission`) que
   * habilitan este módulo — basta con tener UNO de la lista (Fase 75). Un item sin esta
   * lista nunca debería existir hoy: los 14 módulos del roadmap ya tienen al menos un
   * permiso `_VIEW` real que los protege en el backend: usarlo acá es lo que evita que
   * el sidebar muestre módulos a los que el usuario de todas formas no puede entrar
   * (ver el hallazgo de la Fase 70 sobre el rol VENDEDOR).
   */
  permissions: string[];
}

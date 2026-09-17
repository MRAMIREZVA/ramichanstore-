export interface NavItem {
  label: string;
  icon: string;
  route: string;
  available: boolean;
  /** Fase del roadmap (ver CLAUDE.md) en la que este módulo estará disponible. */
  phase?: number;
}

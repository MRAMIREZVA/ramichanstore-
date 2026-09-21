export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'EXPORT';

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: 'Creación',
  UPDATE: 'Actualización',
  DELETE: 'Eliminación',
  RESTORE: 'Restauración',
  LOGIN: 'Inicio de sesión',
  LOGOUT: 'Cierre de sesión',
  LOGIN_FAILED: 'Intento fallido',
  EXPORT: 'Exportación',
};

export interface AuditLogEntry {
  id: number;
  userId: number | null;
  username: string | null;
  action: AuditAction;
  module: string;
  entityName: string | null;
  entityId: string | null;
  oldValue: string | null;
  newValue: string | null;
  ipAddress: string | null;
  createdAt: string;
}

-- ============================================================
-- RamichanStore - V12: permiso de Reportes (Fase 9). El dashboard
-- reutiliza el permiso DASHBOARD_VIEW ya sembrado en V1; la pantalla
-- de Reportes (gráficos y tablas más detalladas) es un módulo propio
-- con su propio permiso.
-- ============================================================

INSERT INTO permissions (code, module, description) VALUES
 ('REPORTS_VIEW', 'REPORTS', 'Ver reportes (gráficos de ventas, ganancias, top productos/categorías, clientes)');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'ADMIN' AND p.code = 'REPORTS_VIEW';

-- ============================================================
-- RamichanStore - V13: portal de clientes, solo lectura (a pedido
-- del dueño de la tienda). Un cliente NO es un `user` del sistema
-- interno (User/Role/Permission siguen siendo exclusivos del staff):
-- son credenciales propias sobre la misma fila de `customers`,
-- deshabilitadas por defecto — el admin decide a qué cliente
-- habilitarle acceso y le fija la contraseña inicial. El principal
-- de un cliente autenticado solo obtiene ROLE_CUSTOMER (sin PERM_*),
-- así que nunca puede alcanzar los endpoints admin por diseño.
-- ============================================================

ALTER TABLE customers ADD
    portal_username       NVARCHAR(50)  NULL,
    portal_password_hash  NVARCHAR(255) NULL,
    portal_enabled        BIT           NOT NULL DEFAULT 0;
GO

-- Lote separado a propósito: SQL Server resuelve nombres de columna al
-- compilar el lote, así que un CREATE INDEX sobre una columna agregada por el
-- ALTER TABLE de arriba falla con "Invalid column name" si comparten lote
-- (ya pasó una vez en esta migración — ver CLAUDE.md).
CREATE UNIQUE INDEX UQ_customers_portal_username ON customers(portal_username)
    WHERE deleted_at IS NULL AND portal_username IS NOT NULL;

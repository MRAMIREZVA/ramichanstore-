-- ============================================================
-- RamichanStore - V6: clientes (Fase 3). Ficha básica del cliente;
-- el historial de compras/preventas/pagos/puntos se calcula desde
-- las tablas de esos módulos cuando existan (Fases 4-7) — no se
-- duplican contadores aquí para evitar desincronización.
-- ============================================================

CREATE TABLE customers (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    full_name       NVARCHAR(200) NOT NULL,
    document_type   NVARCHAR(20)  NULL,
    document_number NVARCHAR(20)  NULL,
    phone           NVARCHAR(30)  NOT NULL,
    whatsapp        NVARCHAR(30)  NULL,
    email           NVARCHAR(150) NULL,
    district        NVARCHAR(100) NULL,
    address         NVARCHAR(255) NULL,
    status          NVARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    notes           NVARCHAR(500) NULL,
    created_at      DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at      DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by      NVARCHAR(100) NULL,
    updated_by      NVARCHAR(100) NULL,
    deleted_at      DATETIME2     NULL,
    CONSTRAINT CK_customers_document_type CHECK (document_type IN ('DNI','RUC','CE','PASSPORT','OTHER')),
    CONSTRAINT CK_customers_status CHECK (status IN ('ACTIVE','INACTIVE'))
);
CREATE UNIQUE INDEX UQ_customers_document_number ON customers(document_number)
    WHERE deleted_at IS NULL AND document_number IS NOT NULL;
CREATE INDEX IX_customers_full_name ON customers(full_name);
CREATE INDEX IX_customers_phone ON customers(phone);

-- ========== PERMISOS ==========
INSERT INTO permissions (code, module, description) VALUES
 ('CUSTOMER_VIEW', 'CUSTOMERS', 'Ver clientes'),
 ('CUSTOMER_CREATE', 'CUSTOMERS', 'Crear clientes'),
 ('CUSTOMER_EDIT', 'CUSTOMERS', 'Editar clientes'),
 ('CUSTOMER_DELETE', 'CUSTOMERS', 'Eliminar clientes (soft delete)');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'ADMIN' AND p.code IN ('CUSTOMER_VIEW', 'CUSTOMER_CREATE', 'CUSTOMER_EDIT', 'CUSTOMER_DELETE');

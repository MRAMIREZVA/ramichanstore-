-- ============================================================
-- RamichanStore - V7: preventas (Fase 4). Una preventa es una
-- campaña ligada a un producto existente (reutiliza nombre, imagen,
-- línea, marca, tamaño, precio y costo de `products`, no los duplica).
-- `preorder_customers` es la reserva de cada cliente dentro de esa
-- campaña; los cupos disponibles se calculan como
-- available_quantity - SUM(preorder_customers.quantity vigentes),
-- nunca como un contador guardado (mismo criterio que Fase 3).
-- ============================================================

CREATE TABLE preorders (
    id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
    product_id              BIGINT         NOT NULL,
    min_deposit_amount      DECIMAL(10,2)  NOT NULL,
    start_date              DATE           NOT NULL,
    limit_date              DATE           NOT NULL,
    estimated_arrival_date  DATE           NULL,
    available_quantity      INT            NOT NULL,
    status                  NVARCHAR(20)   NOT NULL DEFAULT 'COMING_SOON',
    notes                   NVARCHAR(500)  NULL,
    created_at              DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at              DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by              NVARCHAR(100)  NULL,
    updated_by              NVARCHAR(100)  NULL,
    deleted_at              DATETIME2      NULL,
    CONSTRAINT FK_preorders_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT CK_preorders_status CHECK (status IN
        ('COMING_SOON','ACTIVE','SOLD_OUT','IN_TRANSIT','RECEIVED','DELIVERED','CANCELLED'))
);
CREATE INDEX IX_preorders_product_id ON preorders(product_id);
CREATE INDEX IX_preorders_status ON preorders(status);

CREATE TABLE preorder_customers (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    preorder_id     BIGINT        NOT NULL,
    customer_id     BIGINT        NOT NULL,
    quantity        INT           NOT NULL,
    deposit_amount  DECIMAL(10,2) NOT NULL,
    notes           NVARCHAR(500) NULL,
    created_at      DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at      DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by      NVARCHAR(100) NULL,
    updated_by      NVARCHAR(100) NULL,
    deleted_at      DATETIME2     NULL,
    CONSTRAINT FK_preorder_customers_preorder FOREIGN KEY (preorder_id) REFERENCES preorders(id),
    CONSTRAINT FK_preorder_customers_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
);
CREATE INDEX IX_preorder_customers_preorder_id ON preorder_customers(preorder_id);
CREATE INDEX IX_preorder_customers_customer_id ON preorder_customers(customer_id);

-- ========== PERMISOS ==========
INSERT INTO permissions (code, module, description) VALUES
 ('PREORDER_VIEW', 'PREORDERS', 'Ver preventas y reservas'),
 ('PREORDER_CREATE', 'PREORDERS', 'Crear preventas y registrar reservas'),
 ('PREORDER_EDIT', 'PREORDERS', 'Editar preventas'),
 ('PREORDER_DELETE', 'PREORDERS', 'Eliminar preventas y cancelar reservas (soft delete)');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'ADMIN' AND p.code IN ('PREORDER_VIEW', 'PREORDER_CREATE', 'PREORDER_EDIT', 'PREORDER_DELETE');

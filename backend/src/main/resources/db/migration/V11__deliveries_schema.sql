-- ============================================================
-- RamichanStore - V11: entregas (Fase 8). Una entrega es el
-- seguimiento logístico de UNA venta ya registrada ("pedido" del
-- spec = Sale en este sistema); reutiliza delivery_type con los
-- mismos valores que sales.delivery_method. Una venta tiene a lo
-- sumo una entrega activa (índice único filtrado por sale_id).
-- ============================================================

CREATE TABLE deliveries (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    sale_id         BIGINT        NOT NULL,
    delivery_type   NVARCHAR(20)  NOT NULL,
    address         NVARCHAR(255) NULL,
    district        NVARCHAR(100) NULL,
    agency          NVARCHAR(150) NULL,
    courier         NVARCHAR(150) NULL,
    scheduled_date  DATE          NOT NULL,
    status          NVARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    notes           NVARCHAR(500) NULL,
    created_at      DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at      DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by      NVARCHAR(100) NULL,
    updated_by      NVARCHAR(100) NULL,
    deleted_at      DATETIME2     NULL,
    CONSTRAINT FK_deliveries_sale FOREIGN KEY (sale_id) REFERENCES sales(id),
    CONSTRAINT CK_deliveries_type CHECK (delivery_type IN ('PICKUP','DELIVERY','AGENCY')),
    CONSTRAINT CK_deliveries_status CHECK (status IN ('PENDING','PREPARING','READY','SHIPPED','DELIVERED','CANCELLED'))
);
CREATE UNIQUE INDEX UQ_deliveries_sale_id ON deliveries(sale_id) WHERE deleted_at IS NULL;
CREATE INDEX IX_deliveries_status ON deliveries(status);
CREATE INDEX IX_deliveries_scheduled_date ON deliveries(scheduled_date);

-- ========== PERMISOS ==========
INSERT INTO permissions (code, module, description) VALUES
 ('DELIVERY_VIEW', 'DELIVERIES', 'Ver entregas'),
 ('DELIVERY_CREATE', 'DELIVERIES', 'Crear entregas'),
 ('DELIVERY_EDIT', 'DELIVERIES', 'Editar entregas (estado, datos logísticos)');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'ADMIN' AND p.code IN ('DELIVERY_VIEW', 'DELIVERY_CREATE', 'DELIVERY_EDIT');

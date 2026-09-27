-- ============================================================
-- RamichanStore - V41: "Avísame cuando esté disponible" (Fase 44) — un
-- visitante del catálogo deja su nombre/teléfono en un producto agotado; el
-- admin ve la lista al editar ese producto y le escribe por WhatsApp cuando
-- vuelve a haber stock. No hay envío automático (RamichanStore no tiene
-- correo/SMS transaccional, ver lección de Fase 13) — es una lista de leads
-- que el admin dispara a mano, mismo criterio que el resto del proyecto.
-- ============================================================

CREATE TABLE stock_alert_requests (
    id             BIGINT IDENTITY(1,1) PRIMARY KEY,
    product_id     BIGINT NOT NULL,
    customer_name  NVARCHAR(200) NOT NULL,
    customer_phone NVARCHAR(30)  NOT NULL,
    notified       BIT NOT NULL DEFAULT 0,
    notified_at    DATETIME2 NULL,
    created_at     DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at     DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by     NVARCHAR(100) NULL,
    updated_by     NVARCHAR(100) NULL,
    deleted_at     DATETIME2 NULL,
    CONSTRAINT FK_stock_alert_requests_product FOREIGN KEY (product_id) REFERENCES products(id)
);
GO

CREATE INDEX IX_stock_alert_requests_product_id ON stock_alert_requests(product_id);
GO

INSERT INTO permissions (code, module, description) VALUES
 ('STOCK_ALERT_VIEW', 'STOCK_ALERTS', 'Ver quienes pidieron aviso de reingreso de stock'),
 ('STOCK_ALERT_MANAGE', 'STOCK_ALERTS', 'Marcar como notificados los avisos de reingreso de stock');
GO

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'ADMIN' AND p.code IN ('STOCK_ALERT_VIEW', 'STOCK_ALERT_MANAGE');
GO

-- ============================================================
-- RamichanStore - V10: puntos de fidelidad (Fase 7). Ledger
-- append-only: el saldo de un cliente NUNCA se guarda como contador,
-- siempre se calcula como SUM(points) de sus movimientos (mismo
-- criterio que amountPaid en separations o reservedQuantity en
-- preorders) — evita que un contador desincronizado mienta sobre
-- cuántos puntos tiene realmente disponibles.
-- ============================================================

CREATE TABLE loyalty_point_movements (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    customer_id     BIGINT        NOT NULL,
    movement_type   NVARCHAR(20)  NOT NULL,
    points          INT           NOT NULL,
    reason          NVARCHAR(255) NOT NULL,
    sale_id         BIGINT        NULL,
    user_id         BIGINT        NOT NULL,
    username        NVARCHAR(50)  NOT NULL,
    created_at      DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_loyalty_point_movements_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT FK_loyalty_point_movements_sale FOREIGN KEY (sale_id) REFERENCES sales(id),
    CONSTRAINT FK_loyalty_point_movements_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT CK_loyalty_point_movements_type CHECK (movement_type IN
        ('COMPRA','CANJE','AJUSTE_MANUAL','BONIFICACION','VENCIMIENTO'))
);
CREATE INDEX IX_loyalty_point_movements_customer_id ON loyalty_point_movements(customer_id);
CREATE INDEX IX_loyalty_point_movements_created_at ON loyalty_point_movements(created_at);

-- ========== PERMISOS ==========
INSERT INTO permissions (code, module, description) VALUES
 ('LOYALTY_VIEW', 'LOYALTY', 'Ver puntos e historial de movimientos'),
 ('LOYALTY_ADJUST', 'LOYALTY', 'Registrar ajustes manuales, bonificaciones y canjes de puntos');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'ADMIN' AND p.code IN ('LOYALTY_VIEW', 'LOYALTY_ADJUST');

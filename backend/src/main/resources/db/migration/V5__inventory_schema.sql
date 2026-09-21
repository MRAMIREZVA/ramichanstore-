-- ============================================================
-- RamichanStore - V5: inventario (Fase 2). Registro inmutable de
-- movimientos de stock (Ingreso, Venta, Reserva, Separación,
-- Devolución, Ajuste, Pérdida). El stock vivo sigue en
-- products.current_stock; esta tabla es el historial/kardex que
-- lo justifica movimiento a movimiento (previous_stock/new_stock).
-- No lleva soft delete ni columnas de auditoría de fila: es un
-- ledger append-only, igual que audit_logs.
-- ============================================================

CREATE TABLE inventory_movements (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    product_id      BIGINT        NOT NULL,
    movement_type   NVARCHAR(20)  NOT NULL,
    quantity        INT           NOT NULL,
    previous_stock  INT           NOT NULL,
    new_stock       INT           NOT NULL,
    reason          NVARCHAR(255) NOT NULL,
    observation     NVARCHAR(1000) NULL,
    user_id         BIGINT        NOT NULL,
    username        NVARCHAR(50)  NOT NULL,
    created_at      DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_inventory_movements_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT FK_inventory_movements_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT CK_inventory_movements_type CHECK (movement_type IN
        ('INGRESO','VENTA','RESERVA','SEPARACION','DEVOLUCION','AJUSTE','PERDIDA'))
);
CREATE INDEX IX_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX IX_inventory_movements_created_at ON inventory_movements(created_at);
CREATE INDEX IX_inventory_movements_type ON inventory_movements(movement_type);

-- ========== PERMISOS ==========
INSERT INTO permissions (code, module, description) VALUES
 ('INVENTORY_VIEW', 'INVENTORY', 'Ver movimientos de inventario y alertas de stock'),
 ('INVENTORY_CREATE', 'INVENTORY', 'Registrar movimientos de inventario');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'ADMIN' AND p.code IN ('INVENTORY_VIEW', 'INVENTORY_CREATE');

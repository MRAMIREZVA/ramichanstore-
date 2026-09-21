-- ============================================================
-- RamichanStore - V9: separaciones y pagos (Fase 6). Una separación
-- reserva UN producto en stock para un cliente que lo va pagando en
-- abonos; a diferencia de una preventa (Fase 4, producto que aún no
-- llega), aquí el producto ya existe físicamente, así que crear la
-- separación descuenta stock real vía un movimiento SEPARACION en
-- inventory_movements (y cancelarla lo devuelve con DEVOLUCION).
-- `payments` es el ledger de abonos — amount_paid/balance_due de la
-- separación se calculan sumando sus payments, no se guardan como
-- contador (mismo criterio que Fase 3/4). Reutiliza el mismo
-- vocabulario de payment_method y payment_status que `sales`.
-- ============================================================

CREATE TABLE separations (
    id               BIGINT IDENTITY(1,1) PRIMARY KEY,
    customer_id      BIGINT        NOT NULL,
    product_id       BIGINT        NOT NULL,
    quantity         INT           NOT NULL DEFAULT 1,
    total_price      DECIMAL(10,2) NOT NULL,
    separation_date  DATE          NOT NULL,
    limit_date       DATE          NOT NULL,
    status           NVARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    notes            NVARCHAR(500) NULL,
    created_at       DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at       DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by       NVARCHAR(100) NULL,
    updated_by       NVARCHAR(100) NULL,
    deleted_at       DATETIME2     NULL,
    CONSTRAINT FK_separations_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT FK_separations_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT CK_separations_status CHECK (status IN ('PENDING','PARTIAL','PAID','CANCELLED'))
);
CREATE INDEX IX_separations_customer_id ON separations(customer_id);
CREATE INDEX IX_separations_product_id ON separations(product_id);
CREATE INDEX IX_separations_status ON separations(status);

CREATE TABLE payments (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    separation_id   BIGINT        NOT NULL,
    amount          DECIMAL(10,2) NOT NULL,
    payment_method  NVARCHAR(20)  NOT NULL,
    payment_date    DATE          NOT NULL,
    notes           NVARCHAR(500) NULL,
    user_id         BIGINT        NOT NULL,
    username        NVARCHAR(50)  NOT NULL,
    created_at      DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_payments_separation FOREIGN KEY (separation_id) REFERENCES separations(id),
    CONSTRAINT FK_payments_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT CK_payments_method CHECK (payment_method IN ('YAPE','PLIN','TRANSFERENCIA','EFECTIVO','TARJETA','OTROS'))
);
CREATE INDEX IX_payments_separation_id ON payments(separation_id);

-- ========== PERMISOS ==========
INSERT INTO permissions (code, module, description) VALUES
 ('SEPARATION_VIEW', 'SEPARATIONS', 'Ver separaciones y pagos'),
 ('SEPARATION_CREATE', 'SEPARATIONS', 'Crear separaciones y registrar abonos'),
 ('SEPARATION_CANCEL', 'SEPARATIONS', 'Cancelar separaciones (revierte stock)');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'ADMIN' AND p.code IN ('SEPARATION_VIEW', 'SEPARATION_CREATE', 'SEPARATION_CANCEL');

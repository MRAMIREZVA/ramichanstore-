-- ============================================================
-- RamichanStore - V22: dos mejoras a preventas, a pedido explícito
-- del dueño para mejorar la vista del portal de clientes:
--
-- 1) Dos estados nuevos de campaña ("En tienda", "Enviado") entre
--    "Recibida" y "Entregada", para que el timeline de seguimiento
--    del portal tenga los 6 pasos reales que el dueño quiere mostrar.
--
-- 2) Abonos reales por reserva (antes solo existía un deposit_amount
--    fijo al crear la reserva, sin forma de registrar pagos
--    adicionales hasta completar el saldo). Ledger inmutable, mismo
--    patrón que `payments` (Separaciones, Fase 6). El depósito ya
--    cobrado al crear cada reserva se migra como su primer abono, para
--    que "total pagado" siempre sea SUM(preorder_customer_payments) sin
--    casos especiales.
-- ============================================================

ALTER TABLE preorders DROP CONSTRAINT CK_preorders_status;
ALTER TABLE preorders ADD CONSTRAINT CK_preorders_status CHECK (status IN
    ('COMING_SOON','ACTIVE','SOLD_OUT','IN_TRANSIT','RECEIVED','EN_TIENDA','ENVIADO','DELIVERED','CANCELLED'));

CREATE TABLE preorder_customer_payments (
    id                    BIGINT IDENTITY(1,1) PRIMARY KEY,
    preorder_customer_id  BIGINT NOT NULL,
    amount                DECIMAL(10,2) NOT NULL,
    payment_method        NVARCHAR(20) NOT NULL,
    payment_date          DATE NOT NULL,
    notes                 NVARCHAR(500) NULL,
    user_id               BIGINT NOT NULL,
    username              NVARCHAR(50) NOT NULL,
    created_at            DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_preorder_customer_payments_reservation FOREIGN KEY (preorder_customer_id) REFERENCES preorder_customers(id)
);
CREATE INDEX IX_preorder_customer_payments_reservation_id ON preorder_customer_payments(preorder_customer_id);
GO

INSERT INTO preorder_customer_payments (preorder_customer_id, amount, payment_method, payment_date, notes, user_id, username, created_at)
SELECT pc.id, pc.deposit_amount, 'OTROS', CAST(pc.created_at AS DATE), 'Depósito inicial de la reserva (migrado)',
       COALESCE((SELECT TOP 1 id FROM users WHERE username = 'admin'), 1),
       'system', pc.created_at
FROM preorder_customers pc
WHERE pc.deposit_amount > 0;
GO

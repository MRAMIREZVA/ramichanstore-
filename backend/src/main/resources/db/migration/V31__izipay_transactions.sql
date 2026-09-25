-- Pago con Yape en el checkout del catálogo (Fase 37). Ledger append-only de cada intento de
-- pago contra Izipay para un OrderRequest -- nunca se borra, solo se completa (PENDING -> PAID/UNPAID)
-- cuando llega la notificación IPN. Puede haber más de una fila por order_request_id si el cliente
-- reintenta el pago.
CREATE TABLE izipay_transactions (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    order_request_id BIGINT NOT NULL,
    izipay_order_id NVARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'PENDING',
    transaction_uuid NVARCHAR(100) NULL,
    raw_ipn_payload NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    confirmed_at DATETIME2 NULL,
    CONSTRAINT FK_izipay_transactions_order_request FOREIGN KEY (order_request_id) REFERENCES order_requests(id),
    CONSTRAINT CK_izipay_transactions_status CHECK (status IN ('PENDING', 'PAID', 'UNPAID', 'ERROR'))
);
GO

CREATE INDEX IX_izipay_transactions_order_request ON izipay_transactions(order_request_id);
CREATE INDEX IX_izipay_transactions_izipay_order_id ON izipay_transactions(izipay_order_id);

-- ============================================================
-- RamichanStore - V20: titular del EMBARQUE (a nombre de quien va el
-- paquete físicamente, para aduanas/envío) — un concepto distinto del
-- titular de la cuenta ZEN (shipment_holders, quien hace la compra con
-- esa cuenta). A diferencia de shipment_holders, el nombre SÍ puede
-- repetirse — sin índice único a propósito.
-- ============================================================

CREATE TABLE shipment_recipients (
    id          BIGINT IDENTITY(1,1) PRIMARY KEY,
    name        NVARCHAR(150) NOT NULL,
    notes       NVARCHAR(255) NULL,
    created_at  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by  NVARCHAR(100) NULL,
    updated_by  NVARCHAR(100) NULL,
    deleted_at  DATETIME2 NULL
);
GO

-- Nullable a propósito: la maestra nace vacía en esta misma migración, no hay
-- con qué backfillear un embarque que ya existiera de antes (ninguno en
-- producción todavía). Se exige a nivel de aplicación (ShipmentRequest) para
-- los embarques nuevos/editados de aquí en adelante, no a nivel de BD.
ALTER TABLE shipments ADD recipient_id BIGINT NULL;
GO

ALTER TABLE shipments ADD CONSTRAINT FK_shipments_recipient FOREIGN KEY (recipient_id) REFERENCES shipment_recipients(id);
CREATE INDEX IX_shipments_recipient_id ON shipments(recipient_id);
GO

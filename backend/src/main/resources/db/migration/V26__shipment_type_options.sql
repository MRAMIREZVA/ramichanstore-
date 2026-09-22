-- ============================================================
-- RamichanStore - V26: "Tipo de envío" pasa de enum fijo en código a
-- maestra editable por el admin (mismo patrón que shipment_holders/
-- shipment_recipients) — el dueño pidió poder agregar y renombrar
-- valores (EMS/Aéreo/Marítimo) sin depender de un cambio de código.
-- ============================================================

CREATE TABLE shipment_type_options (
    id          BIGINT IDENTITY(1,1) PRIMARY KEY,
    name        NVARCHAR(100) NOT NULL,
    notes       NVARCHAR(255) NULL,
    created_at  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at  DATETIME2 NULL,
    created_by  NVARCHAR(100) NULL,
    updated_by  NVARCHAR(100) NULL,
    deleted_at  DATETIME2 NULL
);
GO

CREATE UNIQUE INDEX UQ_shipment_type_options_name ON shipment_type_options(name) WHERE deleted_at IS NULL;
GO

INSERT INTO shipment_type_options (name) VALUES (N'EMS'), (N'Aéreo'), (N'Marítimo');
GO

ALTER TABLE shipments ADD shipment_type_id BIGINT NULL;
GO

UPDATE s
SET s.shipment_type_id = o.id
FROM shipments s
JOIN shipment_type_options o ON
    (s.shipment_type = 'EMS' AND o.name = N'EMS') OR
    (s.shipment_type = 'AVIA' AND o.name = N'Aéreo') OR
    (s.shipment_type = 'BARCO' AND o.name = N'Marítimo');
GO

ALTER TABLE shipments ALTER COLUMN shipment_type_id BIGINT NOT NULL;
GO

ALTER TABLE shipments ADD CONSTRAINT FK_shipments_shipment_type FOREIGN KEY (shipment_type_id) REFERENCES shipment_type_options(id);
CREATE INDEX IX_shipments_shipment_type ON shipments(shipment_type_id);
GO

ALTER TABLE shipments DROP CONSTRAINT CK_shipments_type;
GO

ALTER TABLE shipments DROP COLUMN shipment_type;
GO

-- ============================================================
-- RamichanStore - V32: envío por agencia (Shalom, Olva, etc.) con datos
-- del destinatario que recoge en la agencia (puede ser distinto a quien
-- compra) — a pedido explícito del dueño, tanto en el checkout del
-- catálogo público como en la gestión de Entregas del admin.
-- ============================================================

-- Maestro de agencias, editable por el admin (mismo patrón que
-- shipment_type_options, Fase 25) — sembrado con las 2 agencias que
-- mencionó el dueño, él puede agregar más desde Configuración.
CREATE TABLE delivery_agencies (
    id          BIGINT IDENTITY(1,1) PRIMARY KEY,
    name        NVARCHAR(100) NOT NULL,
    created_at  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at  DATETIME2 NULL,
    created_by  NVARCHAR(100) NULL,
    updated_by  NVARCHAR(100) NULL,
    deleted_at  DATETIME2 NULL
);
GO

CREATE UNIQUE INDEX UQ_delivery_agencies_name ON delivery_agencies(name) WHERE deleted_at IS NULL;
GO

INSERT INTO delivery_agencies (name) VALUES (N'Shalom'), (N'Olva Courier');
GO

-- Entregas (admin): el campo "agency" (texto libre) nunca tuvo datos reales
-- cargados todavía, se reemplaza directo por la FK a la maestra nueva, sin
-- necesidad de migrar valores existentes. Se agregan los datos del
-- destinatario que recoge en la agencia (puede ser distinto del Customer
-- dueño de la entrega).
ALTER TABLE deliveries ADD delivery_agency_id BIGINT NULL;
ALTER TABLE deliveries ADD recipient_dni NVARCHAR(20) NULL;
ALTER TABLE deliveries ADD recipient_name NVARCHAR(200) NULL;
ALTER TABLE deliveries ADD recipient_phone NVARCHAR(30) NULL;
GO

ALTER TABLE deliveries ADD CONSTRAINT FK_deliveries_agency FOREIGN KEY (delivery_agency_id) REFERENCES delivery_agencies(id);
CREATE INDEX IX_deliveries_agency_id ON deliveries(delivery_agency_id);
GO

ALTER TABLE deliveries DROP COLUMN agency;
GO

-- Checkout del catálogo público: mismos datos de destinatario + agencia,
-- más "provincia" (antes el checkout solo pedía distrito).
ALTER TABLE order_requests ADD delivery_agency_id BIGINT NULL;
ALTER TABLE order_requests ADD recipient_dni NVARCHAR(20) NULL;
ALTER TABLE order_requests ADD recipient_name NVARCHAR(200) NULL;
ALTER TABLE order_requests ADD recipient_phone NVARCHAR(30) NULL;
ALTER TABLE order_requests ADD guest_province NVARCHAR(100) NULL;
GO

ALTER TABLE order_requests ADD CONSTRAINT FK_order_requests_agency FOREIGN KEY (delivery_agency_id) REFERENCES delivery_agencies(id);
CREATE INDEX IX_order_requests_agency_id ON order_requests(delivery_agency_id);
GO

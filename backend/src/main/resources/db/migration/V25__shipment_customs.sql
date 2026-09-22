-- ============================================================
-- RamichanStore - V25: aduanas del embarque — check de si pasó por
-- aduanas con impuestos, monto de impuestos pagado (informativo,
-- confirmado con el dueño que NO entra en "Costo final" de V24),
-- y 4 documentos adjuntos por embarque (invoice, DIF, voucher de
-- pago del DIF, factura) en una tabla hija nueva (mismo patrón
-- binario en BD que product_images/shipment_items.image_data),
-- con un slot único por tipo de documento.
-- ============================================================

ALTER TABLE shipments ADD
    went_through_customs BIT NOT NULL DEFAULT 0,
    customs_tax_amount   DECIMAL(10,2) NULL;

CREATE TABLE shipment_documents (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    shipment_id     BIGINT NOT NULL FOREIGN KEY REFERENCES shipments(id),
    document_type   NVARCHAR(20) NOT NULL CHECK (document_type IN ('INVOICE', 'DIF', 'DIF_VOUCHER', 'FACTURA')),
    file_name       NVARCHAR(255) NOT NULL,
    content_type    NVARCHAR(100) NOT NULL,
    file_data       VARBINARY(MAX) NOT NULL,
    uploaded_at     DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    uploaded_by     NVARCHAR(100) NULL
);

CREATE UNIQUE INDEX UQ_shipment_documents_type ON shipment_documents(shipment_id, document_type);
CREATE INDEX IX_shipment_documents_shipment ON shipment_documents(shipment_id);

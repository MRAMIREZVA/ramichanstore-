-- ============================================================
-- RamichanStore - V16: las entregas dejan de ser 1:1 con una venta
-- y pasan a ser por CLIENTE, con varias compras (ventas y/o
-- separaciones) agrupadas en una sola entrega — a pedido explícito
-- del dueño ("las entregas son netamente por cliente... se puede
-- añadir varias compras del cliente en la entrega").
-- ============================================================

ALTER TABLE deliveries ADD customer_id BIGINT NULL;
GO

UPDATE d
SET d.customer_id = s.customer_id
FROM deliveries d
JOIN sales s ON s.id = d.sale_id
WHERE s.customer_id IS NOT NULL;
GO

-- Defensivo: una entrega cuya venta no tenía cliente asociado no debería
-- existir con datos reales, pero por si acaso no deja huérfanos.
DELETE FROM deliveries WHERE customer_id IS NULL;
GO

ALTER TABLE deliveries ALTER COLUMN customer_id BIGINT NOT NULL;
GO

ALTER TABLE deliveries ADD CONSTRAINT FK_deliveries_customer FOREIGN KEY (customer_id) REFERENCES customers(id);
CREATE INDEX IX_deliveries_customer_id ON deliveries(customer_id);
GO

-- Compras (venta O separación, nunca ambas) incluidas en cada entrega.
CREATE TABLE delivery_items (
    id             BIGINT IDENTITY(1,1) PRIMARY KEY,
    delivery_id    BIGINT    NOT NULL,
    sale_id        BIGINT    NULL,
    separation_id  BIGINT    NULL,
    created_at     DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_delivery_items_delivery FOREIGN KEY (delivery_id) REFERENCES deliveries(id),
    CONSTRAINT FK_delivery_items_sale FOREIGN KEY (sale_id) REFERENCES sales(id),
    CONSTRAINT FK_delivery_items_separation FOREIGN KEY (separation_id) REFERENCES separations(id),
    CONSTRAINT CK_delivery_items_one_ref CHECK (
        (sale_id IS NOT NULL AND separation_id IS NULL) OR
        (sale_id IS NULL AND separation_id IS NOT NULL)
    )
);
GO

-- Una misma compra no puede estar en dos entregas a la vez.
CREATE UNIQUE INDEX UQ_delivery_items_sale ON delivery_items(sale_id) WHERE sale_id IS NOT NULL;
CREATE UNIQUE INDEX UQ_delivery_items_separation ON delivery_items(separation_id) WHERE separation_id IS NOT NULL;
CREATE INDEX IX_delivery_items_delivery_id ON delivery_items(delivery_id);
GO

-- Migra las entregas existentes: cada una tenía exactamente una venta.
INSERT INTO delivery_items (delivery_id, sale_id)
SELECT id, sale_id FROM deliveries WHERE sale_id IS NOT NULL;
GO

-- El vínculo 1:1 de antes ya no existe — ahora vive en delivery_items.
DROP INDEX UQ_deliveries_sale_id ON deliveries;
ALTER TABLE deliveries DROP CONSTRAINT FK_deliveries_sale;
ALTER TABLE deliveries DROP COLUMN sale_id;
GO

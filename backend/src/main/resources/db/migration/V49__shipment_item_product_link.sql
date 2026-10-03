-- ============================================================
-- RamichanStore - V49: vínculo OPCIONAL entre un artículo de embarque y un
-- producto real del catálogo — siembra la base para calcular rentabilidad
-- por embarque más adelante (la Fase 70 lo marcó estructuralmente imposible
-- hoy, porque los artículos son texto libre sin relación con `products`).
-- Nullable, sin backfill — el admin lo completa cuando quiera, nunca
-- obligatorio, mismo patrón que shipments.recipient_id (V20).
-- ============================================================

ALTER TABLE shipment_items ADD product_id BIGINT NULL;
GO

ALTER TABLE shipment_items ADD CONSTRAINT FK_shipment_items_product FOREIGN KEY (product_id) REFERENCES products(id);
CREATE INDEX IX_shipment_items_product_id ON shipment_items(product_id);
GO

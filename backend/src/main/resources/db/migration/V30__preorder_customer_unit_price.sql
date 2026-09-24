-- ============================================================
-- RamichanStore - V30: precio unitario por reserva de preventa
-- (`preorder_customers.unit_price`) en vez de reusar siempre
-- Product.sale_price. Pedido explícito del dueño: algunos clientes
-- reservaron con un precio de preventa/descuento y los nuevos pagan
-- el precio de catálogo vigente — hasta ahora TODAS las reservas de
-- una misma campaña usaban el mismo precio (el actual del producto),
-- sin poder diferenciar. Es un snapshot al momento de reservar
-- (igual que unitPrice en sale_details) que además se puede corregir
-- después vía PUT /api/preorders/reservations/{id}/price.
--
-- Backfill: las reservas ya existentes toman el sale_price actual del
-- producto de su campaña (es la única referencia disponible — no había
-- ningún precio guardado antes de esta migración).
-- ============================================================

ALTER TABLE preorder_customers ADD unit_price DECIMAL(10,2) NULL;
GO

UPDATE pc
SET pc.unit_price = p.sale_price
FROM preorder_customers pc
JOIN preorders po ON po.id = pc.preorder_id
JOIN products p ON p.id = po.product_id
WHERE pc.unit_price IS NULL;
GO

ALTER TABLE preorder_customers ALTER COLUMN unit_price DECIMAL(10,2) NOT NULL;

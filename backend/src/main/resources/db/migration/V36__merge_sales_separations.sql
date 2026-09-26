-- ============================================================
-- RamichanStore - V36: fusiona Ventas y Separaciones en una sola
-- entidad (`sales`, discriminada por `sale_type`) — a pedido
-- explícito del dueño ("ventas y separaciones me parece
-- redundante"). Antes eran dos tablas/entidades separadas; ahora
-- una Separación es "una venta que se paga en abonos" (sale_type =
-- 'SEPARACION'), reutilizando exactamente el mismo esquema de
-- items/pagos. Comportamiento de negocio preservado a propósito:
-- una VENTA sigue generando puntos y exigiendo payment_method/
-- delivery_method; una SEPARACION sigue sin generar puntos y sin
-- esos dos campos (nunca los tuvo a nivel de cabecera).
--
-- Aproximación documentada: las separaciones nunca guardaron
-- costo/ganancia (no existían esas columnas para ellas). Las filas
-- migradas usan el costo ACTUAL del producto como snapshot — no el
-- histórico real al momento de la separación original. Solo afecta
-- el puñado de separaciones ya existentes; toda separación nueva
-- creada después de este cambio sí toma el snapshot real al crearla,
-- igual que una venta.
-- ============================================================

ALTER TABLE sales ADD sale_type NVARCHAR(20) NOT NULL DEFAULT 'VENTA';
GO

ALTER TABLE sales ADD limit_date DATE NULL;
GO

ALTER TABLE sales ADD CONSTRAINT CK_sales_type CHECK (sale_type IN ('VENTA', 'SEPARACION'));
GO

-- payment_method/delivery_method nunca existieron a nivel de cabecera para una
-- separación (el método de pago se registra por abono, no por separación) —
-- pasan a ser opcionales; SaleService exige ambos solo cuando sale_type='VENTA'.
ALTER TABLE sales ALTER COLUMN payment_method NVARCHAR(20) NULL;
GO
ALTER TABLE sales ALTER COLUMN delivery_method NVARCHAR(20) NULL;
GO

-- Columna temporal solo para esta migración: correlaciona cada fila nueva de
-- `sales` con el id viejo de `separations` del que proviene, para poder
-- repuntar `payments`/`delivery_items` más abajo. Se elimina al final.
ALTER TABLE sales ADD legacy_separation_id BIGINT NULL;
GO

INSERT INTO sales (
    sale_type, customer_id, sale_date, payment_method, payment_status, delivery_method, limit_date,
    subtotal, total, total_cost, profit, points_generated, notes,
    legacy_separation_id, created_at, updated_at, created_by, updated_by, deleted_at
)
SELECT
    'SEPARACION', s.customer_id, s.separation_date, NULL, s.status, NULL, s.limit_date,
    s.total_price, s.total_price,
    ROUND(ISNULL(p.purchase_price, 0) * s.quantity + ISNULL(p.additional_costs, 0) * s.quantity, 2),
    s.total_price - ROUND(ISNULL(p.purchase_price, 0) * s.quantity + ISNULL(p.additional_costs, 0) * s.quantity, 2),
    0, s.notes,
    s.id, s.created_at, s.updated_at, s.created_by, s.updated_by, s.deleted_at
FROM separations s
JOIN products p ON p.id = s.product_id;
GO

-- Una línea de detalle (sale_details) por separación migrada.
INSERT INTO sale_details (sale_id, product_id, quantity, unit_price, discount, unit_cost, subtotal)
SELECT
    sale.id, s.product_id, s.quantity,
    ROUND(s.total_price / s.quantity, 2), 0,
    ISNULL(p.purchase_price, 0) + ISNULL(p.additional_costs, 0), s.total_price
FROM separations s
JOIN sales sale ON sale.legacy_separation_id = s.id
JOIN products p ON p.id = s.product_id;
GO

-- Repuntar el ledger de abonos (payments): separation_id -> sale_id.
ALTER TABLE payments ADD sale_id BIGINT NULL;
GO
UPDATE pay
SET pay.sale_id = sale.id
FROM payments pay
JOIN sales sale ON sale.legacy_separation_id = pay.separation_id;
GO
DROP INDEX IX_payments_separation_id ON payments;
ALTER TABLE payments DROP CONSTRAINT FK_payments_separation;
ALTER TABLE payments DROP COLUMN separation_id;
GO
ALTER TABLE payments ALTER COLUMN sale_id BIGINT NOT NULL;
GO
ALTER TABLE payments ADD CONSTRAINT FK_payments_sale FOREIGN KEY (sale_id) REFERENCES sales(id);
CREATE INDEX IX_payments_sale_id ON payments(sale_id);
GO

-- Repuntar delivery_items: las filas que apuntaban a una separación pasan a
-- apuntar a la fila de `sales` migrada correspondiente. El CHECK
-- "exactamente una de las dos" se retira ANTES del UPDATE — de otro modo,
-- el UPDATE dejaría sale_id Y separation_id no-nulos en la misma fila al
-- mismo tiempo (aunque sea solo hasta el DROP COLUMN de abajo) y violaría
-- la constraint de inmediato.
ALTER TABLE delivery_items DROP CONSTRAINT CK_delivery_items_one_ref;
GO
UPDATE di
SET di.sale_id = sale.id
FROM delivery_items di
JOIN sales sale ON sale.legacy_separation_id = di.separation_id
WHERE di.sale_id IS NULL AND di.separation_id IS NOT NULL;
GO
DROP INDEX UQ_delivery_items_separation ON delivery_items;
ALTER TABLE delivery_items DROP CONSTRAINT FK_delivery_items_separation;
ALTER TABLE delivery_items DROP COLUMN separation_id;
GO
-- El índice único filtrado sobre sale_id depende de la columna — hay que
-- quitarlo antes de poder alterarla a NOT NULL, y volverlo a crear después
-- (ya sin necesidad del filtro WHERE, porque ahora sale_id nunca es null).
DROP INDEX UQ_delivery_items_sale ON delivery_items;
GO
ALTER TABLE delivery_items ALTER COLUMN sale_id BIGINT NOT NULL;
GO
CREATE UNIQUE INDEX UQ_delivery_items_sale ON delivery_items(sale_id);
GO

-- Limpieza final: columna temporal, tabla vieja, permisos redundantes.
ALTER TABLE sales DROP COLUMN legacy_separation_id;
GO

DROP TABLE separations;
GO

-- Cualquier rol que tuviera permisos SEPARATION_* gana el equivalente SALE_*
-- (hoy solo ADMIN existe con todos los permisos, así que en la práctica es
-- un no-op — se deja explícito por si se agregan roles nuevos después).
INSERT INTO role_permissions (role_id, permission_id)
SELECT DISTINCT rp.role_id, sp.id
FROM role_permissions rp
JOIN permissions old_p ON old_p.id = rp.permission_id AND old_p.code IN ('SEPARATION_VIEW', 'SEPARATION_CREATE', 'SEPARATION_CANCEL')
JOIN permissions sp ON sp.code = CASE old_p.code
    WHEN 'SEPARATION_VIEW' THEN 'SALE_VIEW'
    WHEN 'SEPARATION_CREATE' THEN 'SALE_CREATE'
    WHEN 'SEPARATION_CANCEL' THEN 'SALE_CANCEL'
END
WHERE NOT EXISTS (
    SELECT 1 FROM role_permissions rp2 WHERE rp2.role_id = rp.role_id AND rp2.permission_id = sp.id
);
GO

DELETE FROM role_permissions WHERE permission_id IN (SELECT id FROM permissions WHERE code IN ('SEPARATION_VIEW', 'SEPARATION_CREATE', 'SEPARATION_CANCEL'));
DELETE FROM permissions WHERE code IN ('SEPARATION_VIEW', 'SEPARATION_CREATE', 'SEPARATION_CANCEL');
GO

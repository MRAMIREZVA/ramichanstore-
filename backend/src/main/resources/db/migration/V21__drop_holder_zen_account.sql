-- ============================================================
-- RamichanStore - V21: quita zen_account de shipment_holders — el
-- número de orden ZEN varía POR EMBARQUE (ya vive en
-- shipments.zen_order_number desde V19), no es un atributo fijo del
-- titular de la cuenta: una misma persona usa muchos números de orden
-- distintos a lo largo del tiempo (confirmado con datos reales del
-- dueño — "Nro ZEN" cambia en cada fila aunque el titular de cuenta
-- sea siempre el mismo).
-- ============================================================

ALTER TABLE shipment_holders DROP COLUMN zen_account;

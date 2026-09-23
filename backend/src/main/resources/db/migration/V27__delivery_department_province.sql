-- ============================================================
-- RamichanStore - V27: departamento/provincia en las entregas — a
-- pedido del dueño, para poder analizar más adelante de dónde son
-- los clientes y de dónde compran más. Mismo criterio que "district"
-- (ya existente): texto libre, opcional, sin migración de datos
-- porque no existía ningún dato previo para estas 2 columnas.
-- ============================================================

ALTER TABLE deliveries ADD
    department NVARCHAR(100) NULL,
    province   NVARCHAR(100) NULL;

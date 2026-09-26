-- Permite pre-registrar artículos de embarque ANTES de saber a qué embarque
-- van a ir (Fase 40): el admin los registra apenas le llegan al almacén de
-- consolidación (código, descripción, cantidad, peso, costos, foto), y luego
-- en el embarque solo busca por código para agregarlos — sin volver a
-- tipear nada. shipment_id pasa a ser opcional: NULL significa "pendiente,
-- todavía no asignado a ningún embarque".

ALTER TABLE shipment_items ALTER COLUMN shipment_id BIGINT NULL;
GO

-- weight es obligatorio para artículos nuevos (validado en la app), pero las filas
-- existentes no tienen ese dato — se backfillea a 0 antes de poner el NOT NULL.
ALTER TABLE shipment_items ADD weight DECIMAL(10,2) NULL;
GO

UPDATE shipment_items SET weight = 0 WHERE weight IS NULL;
GO

ALTER TABLE shipment_items ALTER COLUMN weight DECIMAL(10,2) NOT NULL;
GO

-- Desglose de costo por artículo (opcional) — costo, comisión y recargo por
-- transacción, mismo criterio de "costos siempre en soles" que el resto del
-- módulo (ver CLAUDE.md, Fase 22).
ALTER TABLE shipment_items ADD cost DECIMAL(10,2) NULL;
ALTER TABLE shipment_items ADD commission DECIMAL(10,2) NULL;
ALTER TABLE shipment_items ADD transaction_surcharge DECIMAL(10,2) NULL;
GO

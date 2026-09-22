-- ============================================================
-- RamichanStore - V24: tipo de cambio por embarque + los 3 totales
-- de costos pasan a calcularse siempre (nunca se guardan), mismo
-- criterio que "días en ruta"/"diferencia de peso" ya aplicado en
-- este módulo (ver ShipmentResponse).
--
-- Costo producto + envío + comisión + envío dentro de Japón están en
-- US$ (lo que cobra el servicio proxy en Japón); costo adicional y
-- gastos movibles ya están en S/ (gastos locales en Perú) — por eso
-- "Total" (la suma en US$, convertida a S/) excluye esos dos, y
-- "Costo final" sí los suma, después de la conversión.
-- ============================================================

ALTER TABLE shipments ADD exchange_rate DECIMAL(10,4) NULL;
GO

ALTER TABLE shipments DROP COLUMN total_soles;
ALTER TABLE shipments DROP COLUMN total_dollars;
ALTER TABLE shipments DROP COLUMN final_cost;

-- ============================================================
-- RamichanStore - V28: "Costo adicional" de un embarque deja de ser
-- un monto manual y pasa a calcularse siempre como un porcentaje
-- (configurable en Configuración → Ajustes generales, un solo valor
-- para todos los embarques) sobre Costo producto + envío + comisión
-- + envío dentro de Japón (Total (S/), ver V24) — mismo criterio ya
-- aplicado a Total/Costo final: nunca se guarda lo que se puede
-- calcular. Arranca en 0% para no alterar ningún Costo final
-- existente hasta que el dueño configure el porcentaje real.
-- ============================================================

ALTER TABLE shipments DROP COLUMN additional_cost;

INSERT INTO settings (setting_key, setting_value, data_type, category, description) VALUES
 ('SHIPMENT_ADDITIONAL_COST_PERCENT', '0', 'NUMBER', 'SHIPMENTS',
  'Porcentaje (%) aplicado sobre Costo producto + envío + comisión + envío dentro de Japón para calcular el Costo adicional de cada embarque automáticamente');

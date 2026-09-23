-- ============================================================
-- RamichanStore - V29: "Cobro de aduanas" — monto opcional que un
-- embarque puede pagar en aduana (no todos los barcos pagan), suma
-- SOLO al Costo final, nunca al Total (S/) — mismo comportamiento
-- que Gastos movibles. Distinto del "monto de impuestos" ya
-- existente en la sección Aduanas (customs_tax_amount, V25), que
-- sigue siendo puramente informativo (confirmado con el dueño en
-- Fase 23) — a pedido explícito del dueño, este es un campo nuevo y
-- separado, no un cambio de comportamiento del anterior.
-- ============================================================

ALTER TABLE shipments ADD customs_charge DECIMAL(10,2) NULL;

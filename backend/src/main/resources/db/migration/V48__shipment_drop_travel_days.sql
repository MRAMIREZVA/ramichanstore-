-- ============================================================
-- RamichanStore - V48: "Días de viaje" deja de ser una columna
-- guardada en shipments. Desde Fase 19 el admin ya no podía
-- escribirla a mano (se recalculaba sola en el formulario a partir
-- de Fecha de salida/llegada) pero el valor seguía persistiéndose
-- en cada guardado — contradiciendo el propio criterio del proyecto
-- ("nunca guardar lo que se puede calcular") y duplicando lo que
-- ShipmentResponse.transitDays ya calcula fresco en cada lectura
-- (misma fórmula: días entre salida y llegada, o hasta hoy si aún
-- no llega). El formulario pasa a mostrar un único valor en vivo,
-- sin enviarlo nunca al backend.
-- ============================================================

ALTER TABLE shipments DROP COLUMN travel_days;

package com.ramichanstore.backend.modules.shipments.dto;

/**
 * {@code trackingCode} es opcional: si el admin ya guardó uno antes, se puede omitir (se usa el
 * guardado). Si viene y difiere del guardado, se persiste antes de consultar — ver
 * {@code SerpostTrackingService.resolveTrackingCode} para el porqué (evita forzar un "Guardar"
 * de todo el formulario solo para poder consultar un código recién tipeado).
 */
public record SerpostRefreshRequest(String trackingCode) {
}

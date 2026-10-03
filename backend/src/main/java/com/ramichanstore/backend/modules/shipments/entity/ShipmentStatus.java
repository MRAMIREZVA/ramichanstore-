package com.ramichanstore.backend.modules.shipments.entity;

/**
 * Pendiente de envío, En cotización, Pendiente de pago, En camino, Llegó a Serpost, Llegó a
 * Perú, Observado por aduanas, Listo para delivery, En tienda.
 *
 * <p>Fase 84: {@code LLEGO_A_PERU} estaba declarado AL FINAL (después de {@code EN_TIENDA}/
 * {@code LISTO_PARA_DELIVERY}), aunque un paquete siempre llega al país antes de estar listo
 * para delivery o en tienda — imposible en la realidad. Reordenado a continuación de
 * {@code LLEGO_A_SERPOST} (sin forzar un orden entre esos dos: ver Fase 19, pueden ser rutas
 * alternativas según el tipo de envío). {@code @Enumerated(EnumType.STRING)} en {@code Shipment}
 * hace que este reorden sea puramente cosmético para el `<mat-select>` del admin — no afecta el
 * valor guardado en BD ni ninguna lógica (nada en el backend itera {@code values()} para
 * mandarle un orden al frontend; el combo real lo arma su propio mapa de labels en
 * {@code shipment.model.ts}, reordenado junto con este enum).</p>
 */
public enum ShipmentStatus {
    PENDIENTE_ENVIO, EN_COTIZACION_ENVIO, PENDIENTE_PAGO, EN_CAMINO,
    LLEGO_A_SERPOST, LLEGO_A_PERU, OBSERVADO_ADUANAS, LISTO_PARA_DELIVERY, EN_TIENDA
}

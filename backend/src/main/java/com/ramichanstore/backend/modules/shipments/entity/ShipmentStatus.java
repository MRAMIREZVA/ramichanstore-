package com.ramichanstore.backend.modules.shipments.entity;

/** Pendiente de envío, En cotización, Pendiente de pago, En camino, Llegó a Serpost, Observado por aduanas, Listo para delivery, En tienda, Llegó a Perú. */
public enum ShipmentStatus {
    PENDIENTE_ENVIO, EN_COTIZACION_ENVIO, PENDIENTE_PAGO, EN_CAMINO,
    LLEGO_A_SERPOST, OBSERVADO_ADUANAS, LISTO_PARA_DELIVERY, EN_TIENDA, LLEGO_A_PERU
}

package com.ramichanstore.backend.modules.inventory.entity;

/**
 * Tipos de movimiento de inventario (ver CLAUDE.md, sección 6). INGRESO y
 * DEVOLUCION suman al stock; VENTA, RESERVA, SEPARACION y PERDIDA restan.
 * AJUSTE es el único tipo cuya dirección la decide la cantidad (puede ser
 * positiva o negativa) porque corrige el stock manualmente.
 */
public enum MovementType {
    INGRESO, VENTA, RESERVA, SEPARACION, DEVOLUCION, AJUSTE, PERDIDA;

    public boolean increasesStock() {
        return this == INGRESO || this == DEVOLUCION;
    }
}

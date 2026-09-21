package com.ramichanstore.backend.modules.loyalty.entity;

public enum LoyaltyMovementType {
    COMPRA, CANJE, AJUSTE_MANUAL, BONIFICACION, VENCIMIENTO;

    public boolean increasesBalance() {
        return this == COMPRA || this == BONIFICACION;
    }
}

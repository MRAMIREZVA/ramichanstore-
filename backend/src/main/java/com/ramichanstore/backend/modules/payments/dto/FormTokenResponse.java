package com.ramichanstore.backend.modules.payments.dto;

/** Lo que el frontend necesita para desplegar el formulario embebido de Izipay (Krypton client). */
public record FormTokenResponse(String formToken, String publicKey) {
}

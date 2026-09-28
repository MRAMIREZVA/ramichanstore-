package com.ramichanstore.backend.modules.customers.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Habilitar el portal de un cliente NO recibe contraseña: la contraseña es su número de
 * documento, y el backend la deriva de acá (misma razón por la que los totales de una venta
 * se calculan en el servidor — si el frontend mandara la contraseña, nada garantizaría que
 * de verdad coincide con el documento).
 * <p>
 * El documento se guarda también en el propio cliente, así que este es el único lugar donde
 * puede entrar por primera vez si el cliente se había registrado sin él.
 * <p>
 * Mínimo 8 caracteres porque termina siendo la contraseña del portal: un DNI peruano tiene
 * exactamente 8 dígitos, así que en la práctica solo bloquea documentos más cortos.
 */
public record EnablePortalAccessRequest(
        @NotBlank(message = "El usuario es obligatorio") @Size(max = 50) String username,
        @NotBlank(message = "El número de documento es obligatorio")
        @Size(min = 8, max = 20, message = "El documento debe tener al menos 8 caracteres porque será la contraseña del portal")
        String documentNumber) {
}

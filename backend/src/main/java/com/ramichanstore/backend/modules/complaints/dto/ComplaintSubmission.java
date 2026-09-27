package com.ramichanstore.backend.modules.complaints.dto;

import com.ramichanstore.backend.modules.complaints.entity.ComplaintType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/**
 * Submit público (sin login) del Libro de Reclamaciones — ver SecurityConfig,
 * POST /api/complaints es la única ruta de este módulo sin @PreAuthorize.
 * Campos calcados de lo que exige la ley peruana (D.S. 011-2011-PCM): tipo
 * (Reclamo/Queja), identificación completa del consumidor, identificación
 * del bien/servicio, detalle y pedido concreto. `guardianFullName`/
 * `guardianDocumentNumber` solo son obligatorios en el frontend cuando
 * `isMinor=true` — el backend no los valida como @NotBlank porque son
 * condicionales, no siempre requeridos.
 */
public record ComplaintSubmission(
        @NotNull(message = "El tipo (reclamo o queja) es obligatorio") ComplaintType type,
        @NotBlank(message = "El nombre completo es obligatorio") @Size(max = 200) String consumerFullName,
        @NotBlank(message = "El tipo de documento es obligatorio") @Size(max = 20) String consumerDocumentType,
        @NotBlank(message = "El número de documento es obligatorio") @Size(max = 20) String consumerDocumentNumber,
        @NotBlank(message = "El domicilio es obligatorio") @Size(max = 255) String consumerAddress,
        @NotBlank(message = "El correo es obligatorio") @Email(message = "Correo inválido") @Size(max = 150) String consumerEmail,
        @NotBlank(message = "El teléfono es obligatorio") @Size(max = 30) String consumerPhone,
        boolean isMinor,
        @Size(max = 200) String guardianFullName,
        @Size(max = 20) String guardianDocumentNumber,
        @NotBlank(message = "La descripción del bien o servicio es obligatoria") @Size(max = 500) String goodDescription,
        @DecimalMin(value = "0", inclusive = true) BigDecimal claimedAmount,
        @NotBlank(message = "El detalle es obligatorio") String detail,
        @NotBlank(message = "El pedido concreto es obligatorio") String consumerRequest) {
}

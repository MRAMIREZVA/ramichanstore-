package com.ramichanstore.backend.modules.payments.dto;

import jakarta.validation.constraints.NotBlank;

/** Lo que manda el widget embebido de Izipay al frontend en {@code KR.onSubmit} — ver checkout-page. */
public record ValidateAnswerRequest(
        @NotBlank(message = "kr-answer es obligatorio") String krAnswer,
        @NotBlank(message = "kr-hash es obligatorio") String krHash) {
}

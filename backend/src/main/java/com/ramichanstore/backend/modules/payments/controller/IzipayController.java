package com.ramichanstore.backend.modules.payments.controller;

import com.ramichanstore.backend.common.dto.ApiResponse;
import com.ramichanstore.backend.modules.payments.dto.FormTokenRequest;
import com.ramichanstore.backend.modules.payments.dto.FormTokenResponse;
import com.ramichanstore.backend.modules.payments.dto.ValidateAnswerRequest;
import com.ramichanstore.backend.modules.payments.service.IzipayService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Pago con Yape vía Izipay en el checkout del catálogo (Fase 37) — ambos endpoints son públicos a
 * propósito (ver SecurityConfig, permitAll para "/api/payments/izipay/**"): `form-token` lo llama
 * el propio checkout sin login, e `ipn` lo llama el servidor de Izipay directo, nunca un navegador.
 */
@RestController
@RequestMapping("/api/payments/izipay")
@RequiredArgsConstructor
@Slf4j
public class IzipayController {

    private final IzipayService izipayService;

    @PostMapping("/form-token")
    public ApiResponse<FormTokenResponse> formToken(@Valid @RequestBody FormTokenRequest request) {
        return ApiResponse.ok(izipayService.createFormToken(request.orderRequestId()));
    }

    /**
     * Verificación instantánea del lado del cliente, llamada por el checkout apenas termina el
     * intento de pago en el widget — NO es la fuente de verdad (esa es {@code /ipn}), solo permite
     * mostrarle al cliente un mensaje optimista mientras se espera la confirmación real por IPN.
     */
    @PostMapping("/validate")
    public ApiResponse<Boolean> validate(@Valid @RequestBody ValidateAnswerRequest request) {
        return ApiResponse.ok(izipayService.validateFrontendAnswer(request.krAnswer(), request.krHash()));
    }

    /**
     * IPN (Instant Payment Notification) de Izipay — servidor a servidor. Se configura en el Back
     * Office Vendedor de Izipay: Configuración → Reglas de notificación → URL de notificación al
     * final del pago, apuntando a esta ruta.
     */
    @PostMapping(path = "/ipn", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ResponseEntity<String> ipn(
            @RequestParam("kr-answer") String krAnswer, @RequestParam("kr-hash") String krHash) {
        try {
            izipayService.handleIpn(krAnswer, krHash);
        } catch (Exception e) {
            log.error("Error procesando IPN de Izipay", e);
            // Devolvemos 200 igual: un 4xx/5xx haría que Izipay reintente indefinidamente una IPN
            // que ya quedó registrada (o que nunca va a poder procesarse, ej. firma inválida).
        }
        return ResponseEntity.ok("OK");
    }
}

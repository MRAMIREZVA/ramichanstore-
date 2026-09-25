package com.ramichanstore.backend.modules.payments.service;

import com.ramichanstore.backend.audit.AuditAction;
import com.ramichanstore.backend.audit.AuditService;
import com.ramichanstore.backend.common.exception.BusinessRuleException;
import com.ramichanstore.backend.modules.orderrequests.entity.OrderRequest;
import com.ramichanstore.backend.modules.orderrequests.entity.OrderRequestStatus;
import com.ramichanstore.backend.modules.orderrequests.service.OrderRequestService;
import com.ramichanstore.backend.modules.payments.config.IzipayProperties;
import com.ramichanstore.backend.modules.payments.dto.FormTokenResponse;
import com.ramichanstore.backend.modules.payments.entity.IzipayTransaction;
import com.ramichanstore.backend.modules.payments.entity.IzipayTransactionStatus;
import com.ramichanstore.backend.modules.payments.repository.IzipayTransactionRepository;
import com.ramichanstore.backend.security.SecurityUser;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Pago con Yape (código de aprobación) vía Izipay en el checkout del catálogo (Fase 37).
 * <p>
 * Flujo: 1) el frontend pide un formToken para un {@link OrderRequest} ya creado (mismo total que
 * ya quedó guardado ahí, nunca un monto que mande el propio frontend); 2) Izipay procesa el pago
 * directo con su servidor cuando el cliente ingresa su código Yape en el widget embebido;
 * 3) Izipay nos avisa el resultado por IPN (servidor a servidor) — SOLO esa notificación, verificada
 * con firma HMAC-SHA256, es la fuente de verdad de que el pago se realizó; nunca se confía en una
 * señal del navegador del cliente para convertir el pedido en venta real.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class IzipayService {

    private static final String MODULE = "PAYMENTS";
    private static final String CREATE_PAYMENT_PATH = "/api-payment/V4/Charge/CreatePayment";

    private final IzipayProperties izipayProperties;
    private final IzipayTransactionRepository izipayTransactionRepository;
    private final OrderRequestService orderRequestService;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;
    private final RestClient restClient = RestClient.create();

    /**
     * Genera el formToken para desplegar el widget de Yape. El monto SIEMPRE se recalcula acá desde
     * los `OrderRequestItem` ya guardados (nunca desde un valor que mande el frontend) — mismo
     * criterio que {@code OrderRequestResponse.from} usa para el total mostrado en el admin.
     */
    @Transactional
    public FormTokenResponse createFormToken(Long orderRequestId) {
        if (!izipayProperties.isConfigured()) {
            throw new BusinessRuleException("El pago en línea con Yape no está configurado todavía");
        }
        OrderRequest orderRequest = orderRequestService.findById(orderRequestId);
        if (orderRequest.getStatus() != OrderRequestStatus.PENDING) {
            throw new BusinessRuleException("Este pedido ya no está pendiente de pago");
        }

        BigDecimal total = orderRequest.getItems().stream()
                .map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
        if (total.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("El pedido no tiene un monto válido para cobrar");
        }

        String izipayOrderId = "OR" + orderRequest.getId();

        Map<String, Object> billingDetails = new LinkedHashMap<>();
        billingDetails.put("firstName", orderRequest.getGuestName());
        billingDetails.put("lastName", "-");
        billingDetails.put("phoneNumber", orderRequest.getGuestPhone());
        billingDetails.put("address", orderRequest.getGuestAddress() != null ? orderRequest.getGuestAddress() : "-");
        billingDetails.put("country", "PE");
        billingDetails.put("city", orderRequest.getGuestDistrict() != null ? orderRequest.getGuestDistrict() : "Lima");
        billingDetails.put("state", "Lima");
        billingDetails.put("zipCode", "00000");

        Map<String, Object> customer = new LinkedHashMap<>();
        customer.put("billingDetails", billingDetails);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("amount", total.multiply(BigDecimal.valueOf(100)).intValueExact());
        body.put("currency", "PEN");
        body.put("orderId", izipayOrderId);
        body.put("customer", customer);

        JsonNode response;
        try {
            response = restClient.post()
                    .uri(izipayProperties.getApiBaseUrl() + CREATE_PAYMENT_PATH)
                    .contentType(MediaType.APPLICATION_JSON)
                    .headers(h -> h.setBasicAuth(izipayProperties.getUsername(), izipayProperties.getPassword()))
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException e) {
            log.error("Izipay CreatePayment respondió {} — cuerpo: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new BusinessRuleException("No se pudo iniciar el pago con Yape, intenta de nuevo en un momento");
        }

        String formToken = response != null ? response.path("answer").path("formToken").asText(null) : null;
        if (formToken == null || formToken.isBlank()) {
            log.error("Izipay CreatePayment no devolvió formToken. Respuesta: {}", response);
            throw new BusinessRuleException("No se pudo iniciar el pago con Yape, intenta de nuevo en un momento");
        }

        IzipayTransaction transaction = new IzipayTransaction();
        transaction.setOrderRequest(orderRequest);
        transaction.setIzipayOrderId(izipayOrderId);
        transaction.setAmount(total);
        transaction.setStatus(IzipayTransactionStatus.PENDING);
        izipayTransactionRepository.save(transaction);

        return new FormTokenResponse(formToken, izipayProperties.getPublicKey());
    }

    /**
     * Verifica la notificación IPN de Izipay (servidor a servidor) y, si el pago quedó `PAID`,
     * convierte el pedido web en una venta real — mismo `OrderRequestService.convertToSale` que ya
     * usa el flujo manual del admin, pero con un actor sintético (ver {@link SecurityUser#system()})
     * porque acá no hay ninguna sesión de staff detrás.
     */
    @Transactional
    public void handleIpn(String krAnswer, String krHash) {
        if (!izipayProperties.isConfigured()) {
            throw new BusinessRuleException("Izipay no está configurado");
        }
        if (!verifyHash(krAnswer, krHash, izipayProperties.getPassword())) {
            log.warn("IPN de Izipay con firma inválida — ignorada");
            throw new BusinessRuleException("Firma inválida");
        }

        JsonNode answer;
        try {
            answer = objectMapper.readTree(krAnswer);
        } catch (Exception e) {
            throw new BusinessRuleException("kr-answer inválido");
        }

        String orderStatus = answer.path("orderStatus").asText(null);
        String izipayOrderId = answer.path("orderDetails").path("orderId").asText(null);
        String transactionUuid = answer.path("transactions").isArray() && !answer.path("transactions").isEmpty()
                ? answer.path("transactions").get(0).path("uuid").asText(null)
                : null;

        if (izipayOrderId == null) {
            log.warn("IPN de Izipay sin orderId en la respuesta: {}", krAnswer);
            return;
        }

        IzipayTransaction transaction = izipayTransactionRepository
                .findTopByIzipayOrderIdAndStatusOrderByCreatedAtDesc(izipayOrderId, IzipayTransactionStatus.PENDING)
                .orElse(null);
        if (transaction == null) {
            // Puede ser un reenvío de una IPN ya procesada antes (Izipay reintenta) — no es un error.
            log.info("IPN de Izipay para {} sin transacción PENDING (probable reenvío) — se ignora", izipayOrderId);
            return;
        }

        boolean paid = "PAID".equalsIgnoreCase(orderStatus);
        transaction.setStatus(paid ? IzipayTransactionStatus.PAID : IzipayTransactionStatus.UNPAID);
        transaction.setTransactionUuid(transactionUuid);
        transaction.setRawIpnPayload(krAnswer);
        transaction.setConfirmedAt(LocalDateTime.now());
        izipayTransactionRepository.save(transaction);

        auditService.log(AuditAction.UPDATE, MODULE, "IzipayTransaction", transaction.getId().toString(),
                "PENDING", orderStatus);

        if (!paid) {
            return;
        }

        OrderRequest orderRequest = transaction.getOrderRequest();
        if (orderRequest.getStatus() != OrderRequestStatus.PENDING) {
            // Ya se convirtió antes (otra IPN duplicada, o el admin lo aprobó a mano mientras tanto).
            log.info("Pedido web #{} ya no está pendiente (status={}) — no se vuelve a convertir",
                    orderRequest.getId(), orderRequest.getStatus());
            return;
        }
        orderRequestService.convertToSale(orderRequest.getId(), SecurityUser.system());
    }

    /**
     * Verificación INSTANTÁNEA del lado del cliente (llamada por el checkout apenas
     * {@code KR.onSubmit} dispara, antes de que llegue la IPN) — usa la Clave Hash (HMAC-SHA256),
     * NUNCA la Clave de API (esa es solo para la IPN servidor-a-servidor). Es puramente informativa
     * para la UX: no toca ningún estado ni convierte nada — la conversión real a venta SIEMPRE
     * ocurre en {@link #handleIpn}, la única fuente de verdad.
     */
    public boolean validateFrontendAnswer(String krAnswer, String krHash) {
        if (!izipayProperties.isConfigured()) {
            return false;
        }
        return verifyHash(krAnswer, krHash, izipayProperties.getHmacSha256Key());
    }

    /** HMAC-SHA256 de `krAnswer` con `key`, comparado contra `krHash` — algoritmo exacto de Izipay. */
    boolean verifyHash(String krAnswer, String krHash, String key) {
        if (krAnswer == null || krHash == null || key == null) {
            return false;
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] computed = mac.doFinal(krAnswer.getBytes(StandardCharsets.UTF_8));
            String computedHex = HexFormat.of().formatHex(computed);
            return computedHex.equalsIgnoreCase(krHash.trim());
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("Error calculando HMAC-SHA256 de Izipay", e);
            return false;
        }
    }
}

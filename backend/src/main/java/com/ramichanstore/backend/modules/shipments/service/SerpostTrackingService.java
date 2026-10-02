package com.ramichanstore.backend.modules.shipments.service;

import com.ramichanstore.backend.audit.AuditAction;
import com.ramichanstore.backend.audit.AuditService;
import com.ramichanstore.backend.common.exception.BusinessRuleException;
import com.ramichanstore.backend.common.exception.ResourceNotFoundException;
import com.ramichanstore.backend.modules.shipments.entity.Shipment;
import com.ramichanstore.backend.modules.shipments.repository.ShipmentRepository;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import tools.jackson.databind.JsonNode;

/**
 * Consulta en vivo el "Seguimiento en Línea" de Serpost (Fase 80) — el dueño pidió explícitamente
 * traer el estado DENTRO del sistema en vez de solo enlazar a la página externa, y que una caída
 * de esa página NUNCA borre el último estado ya conocido.
 * <p>
 * <b>No es una API pública documentada de Serpost</b> — se encontró inspeccionando el JavaScript que
 * su propia página de seguimiento ({@code serpost.com.pe/Cliente/SegumientoLinea}) le sirve a
 * CUALQUIER visitante sin login: ese JS llama a un webservice REST aparte
 * ({@code webservice.serpost.com.pe/Web_Api_Seguimiento}) autenticándose con un cuerpo fijo
 * ({@link #AUTH_BODY}) — no son credenciales secretas de RamichanStore, son literalmente las que
 * trae el código público de su propio sitio, usadas acá para hacer lo mismo que hace un visitante
 * al escribir un código en su formulario: una consulta de solo lectura de UN envío propio. Al ser
 * no oficial, Serpost puede cambiar la URL/el cuerpo de autenticación sin avisar — por eso cualquier
 * fallo (red, 401, formato de respuesta distinto) se trata como "temporalmente no disponible", nunca
 * como "el envío no tiene estado": ver {@link #refreshStatus}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SerpostTrackingService {

    private static final String MODULE = "SHIPMENTS";
    private static final String AUTH_URL = "https://webservice.serpost.com.pe/Web_Api_Seguimiento/api/Autenticacion/Validar";
    private static final String EVENTS_URL = "https://webservice.serpost.com.pe/Web_Api_Seguimiento/api/EventoIPS/";
    /** Cuerpo literal que la propia página pública de Serpost envía — ver Javadoc de la clase. */
    private static final Map<String, Object> AUTH_BODY = Map.of("_Ox76", "_0x2eb74d(7)", "_Ox77", "_53/X73POo57/x520");
    private static final DateTimeFormatter SERPOST_DATE_FORMAT = DateTimeFormatter.ofPattern("MM/dd/yyyy HH:mm:ss");

    private final ShipmentRepository shipmentRepository;
    private final AuditService auditService;
    private final RestClient restClient = RestClient.create();

    /**
     * Actualiza {@code serpostStatus}/{@code serpostStatusAt}/{@code serpostCheckedAt} SOLO si la
     * consulta en vivo tuvo éxito y trajo al menos un evento — en cualquier otro caso (sin código
     * configurado, Serpost caído/cambiado, código sin eventos todavía) lanza {@link BusinessRuleException}
     * con un mensaje distinto para cada caso, dejando el último estado guardado intacto. El dueño pidió
     * esto explícitamente: "en caso que la página se caiga no actualizar el estado".
     */
    @Transactional
    public String refreshStatus(Long shipmentId, String trackingCodeOverride) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> ResourceNotFoundException.of("Embarque", shipmentId));
        String code = resolveTrackingCode(shipment, trackingCodeOverride);
        if (code == null || code.isBlank()) {
            throw new BusinessRuleException("Este embarque no tiene un código de rastreo de Serpost configurado");
        }

        JsonNode events = fetchEvents(code.trim());
        if (events == null) {
            throw new BusinessRuleException("No se pudo consultar Serpost en este momento — se mantiene el último estado conocido");
        }
        if (!events.isArray() || events.isEmpty()) {
            throw new BusinessRuleException("Serpost no tiene información todavía para el código " + code.trim());
        }

        JsonNode latest = events.get(0);
        String status = latest.path("descespa").asText(null);
        if (status == null || status.isBlank()) {
            throw new BusinessRuleException("Serpost respondió sin un estado legible para este código — se mantiene el último estado conocido");
        }
        status = status.trim();

        shipment.setSerpostStatus(status);
        shipment.setSerpostStatusAt(parseSerpostDate(latest.path("fecha").asText(null)));
        shipment.setSerpostCheckedAt(LocalDateTime.now());
        shipmentRepository.save(shipment);
        auditService.log(AuditAction.UPDATE, MODULE, "Shipment", shipmentId.toString(), null, "estado Serpost: " + status);
        return "Estado actualizado: " + status;
    }

    /**
     * Si el admin tipeó un código en el formulario sin pasar primero por "Guardar" (el caso real
     * reportado: tipear el código por primera vez y darle directo a "Consultar estado"), se persiste
     * ACÁ MISMO antes de consultar — evita el paso extra de guardar → reabrir → recién consultar.
     * Un código nuevo invalida cualquier estado ya guardado (pertenecía al código anterior), mismo
     * criterio que {@code ShipmentService.applySerpostTrackingCode} para la edición normal del form.
     */
    private String resolveTrackingCode(Shipment shipment, String override) {
        String trimmedOverride = override != null ? override.trim() : null;
        if (trimmedOverride == null || trimmedOverride.isBlank()) {
            return shipment.getSerpostTrackingCode();
        }
        if (!trimmedOverride.equals(shipment.getSerpostTrackingCode())) {
            shipment.setSerpostTrackingCode(trimmedOverride);
            shipment.setSerpostStatus(null);
            shipment.setSerpostStatusAt(null);
            shipment.setSerpostCheckedAt(null);
            shipmentRepository.save(shipment);
        }
        return trimmedOverride;
    }

    /** {@code null} ante CUALQUIER fallo (red, HTTP de error, formato inesperado) — nunca propaga la excepción. */
    private JsonNode fetchEvents(String code) {
        String token = authenticate();
        if (token == null) {
            return null;
        }
        try {
            return restClient.get()
                    .uri(EVENTS_URL + code)
                    .header(HttpHeaders.AUTHORIZATION, "BEARER " + token)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.warn("No se pudo consultar EventoIPS de Serpost para el código {}: {}", code, e.toString());
            return null;
        }
    }

    private String authenticate() {
        try {
            JsonNode response = restClient.post()
                    .uri(AUTH_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new LinkedHashMap<>(AUTH_BODY))
                    .retrieve()
                    .body(JsonNode.class);
            String token = response != null ? response.path("token").asText(null) : null;
            return (token != null && !token.isBlank()) ? token : null;
        } catch (RestClientException e) {
            log.warn("No se pudo autenticar contra la API de Serpost: {}", e.toString());
            return null;
        }
    }

    /** Formato real observado en la respuesta ("MM/dd/yyyy HH:mm:ss") — null si Serpost lo cambia sin avisar, sin romper el resto. */
    private LocalDateTime parseSerpostDate(String fecha) {
        if (fecha == null || fecha.isBlank()) {
            return null;
        }
        try {
            return LocalDateTime.parse(fecha.trim(), SERPOST_DATE_FORMAT);
        } catch (Exception e) {
            log.warn("No se pudo parsear la fecha de Serpost '{}': {}", fecha, e.toString());
            return null;
        }
    }
}

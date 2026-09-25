package com.ramichanstore.backend.modules.deliveryagencies.service;

import com.ramichanstore.backend.audit.AuditAction;
import com.ramichanstore.backend.audit.AuditService;
import com.ramichanstore.backend.common.exception.ResourceNotFoundException;
import com.ramichanstore.backend.modules.deliveryagencies.dto.DeliveryAgencyRequest;
import com.ramichanstore.backend.modules.deliveryagencies.dto.DeliveryAgencyResponse;
import com.ramichanstore.backend.modules.deliveryagencies.entity.DeliveryAgency;
import com.ramichanstore.backend.modules.deliveryagencies.repository.DeliveryAgencyRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Maestro de agencias de envío (Shalom, Olva Courier, etc.) — reutilizado por
 * Entregas (admin) y por {@code CatalogService} para el checkout público,
 * mismo criterio de composición que el resto de maestros de solo lectura.
 */
@Service
@RequiredArgsConstructor
public class DeliveryAgencyService {

    private static final String MODULE = "DELIVERIES";

    private final DeliveryAgencyRepository deliveryAgencyRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<DeliveryAgencyResponse> findAll() {
        return deliveryAgencyRepository.findAllByOrderByNameAsc().stream().map(DeliveryAgencyResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public DeliveryAgency findById(Long id) {
        return deliveryAgencyRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Agencia de envío", id));
    }

    @Transactional
    public DeliveryAgency create(DeliveryAgencyRequest request) {
        DeliveryAgency agency = new DeliveryAgency();
        agency.setName(request.name());
        DeliveryAgency saved = deliveryAgencyRepository.save(agency);
        auditService.log(AuditAction.CREATE, MODULE, "DeliveryAgency", saved.getId().toString(), null, saved.getName());
        return saved;
    }

    @Transactional
    public DeliveryAgency update(Long id, DeliveryAgencyRequest request) {
        DeliveryAgency agency = findById(id);
        String oldName = agency.getName();
        agency.setName(request.name());
        DeliveryAgency saved = deliveryAgencyRepository.save(agency);
        auditService.log(AuditAction.UPDATE, MODULE, "DeliveryAgency", id.toString(), oldName, saved.getName());
        return saved;
    }

    @Transactional
    public void delete(Long id) {
        DeliveryAgency agency = findById(id);
        agency.softDelete();
        deliveryAgencyRepository.save(agency);
        auditService.log(AuditAction.DELETE, MODULE, "DeliveryAgency", id.toString(), agency.getName(), null);
    }
}

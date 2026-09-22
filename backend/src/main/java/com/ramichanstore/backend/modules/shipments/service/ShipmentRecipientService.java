package com.ramichanstore.backend.modules.shipments.service;

import com.ramichanstore.backend.audit.AuditAction;
import com.ramichanstore.backend.audit.AuditService;
import com.ramichanstore.backend.common.exception.BusinessRuleException;
import com.ramichanstore.backend.common.exception.ResourceNotFoundException;
import com.ramichanstore.backend.modules.shipments.dto.ShipmentRecipientRequest;
import com.ramichanstore.backend.modules.shipments.entity.ShipmentRecipient;
import com.ramichanstore.backend.modules.shipments.repository.ShipmentRecipientRepository;
import com.ramichanstore.backend.modules.shipments.repository.ShipmentRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ShipmentRecipientService {

    private static final String MODULE = "SHIPMENTS";

    private final ShipmentRecipientRepository shipmentRecipientRepository;
    private final ShipmentRepository shipmentRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<ShipmentRecipient> findAll() {
        return shipmentRecipientRepository.findAll();
    }

    @Transactional(readOnly = true)
    public ShipmentRecipient findById(Long id) {
        return shipmentRecipientRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Titular del embarque", id));
    }

    @Transactional
    public ShipmentRecipient create(ShipmentRecipientRequest request) {
        ShipmentRecipient recipient = new ShipmentRecipient();
        applyRequest(recipient, request);
        ShipmentRecipient saved = shipmentRecipientRepository.save(recipient);
        auditService.log(AuditAction.CREATE, MODULE, "ShipmentRecipient", saved.getId().toString(), null, saved.getName());
        return saved;
    }

    @Transactional
    public ShipmentRecipient update(Long id, ShipmentRecipientRequest request) {
        ShipmentRecipient recipient = findById(id);
        String oldName = recipient.getName();
        applyRequest(recipient, request);
        ShipmentRecipient saved = shipmentRecipientRepository.save(recipient);
        auditService.log(AuditAction.UPDATE, MODULE, "ShipmentRecipient", id.toString(), oldName, saved.getName());
        return saved;
    }

    /** Igual criterio que ShipmentHolderService: no borrar un "padre" con embarques vigentes. */
    @Transactional
    public void delete(Long id) {
        ShipmentRecipient recipient = findById(id);
        if (shipmentRepository.existsByRecipientId(id)) {
            throw new BusinessRuleException("No se puede eliminar un titular de embarque con embarques registrados");
        }
        recipient.softDelete();
        shipmentRecipientRepository.save(recipient);
        auditService.log(AuditAction.DELETE, MODULE, "ShipmentRecipient", id.toString(), recipient.getName(), null);
    }

    private void applyRequest(ShipmentRecipient recipient, ShipmentRecipientRequest request) {
        recipient.setName(request.name());
        recipient.setNotes(request.notes());
    }
}

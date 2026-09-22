package com.ramichanstore.backend.modules.shipments.service;

import com.ramichanstore.backend.audit.AuditAction;
import com.ramichanstore.backend.audit.AuditService;
import com.ramichanstore.backend.common.exception.BusinessRuleException;
import com.ramichanstore.backend.common.exception.ResourceNotFoundException;
import com.ramichanstore.backend.modules.shipments.dto.ShipmentTypeOptionRequest;
import com.ramichanstore.backend.modules.shipments.entity.ShipmentTypeOption;
import com.ramichanstore.backend.modules.shipments.repository.ShipmentRepository;
import com.ramichanstore.backend.modules.shipments.repository.ShipmentTypeOptionRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ShipmentTypeOptionService {

    private static final String MODULE = "SHIPMENTS";

    private final ShipmentTypeOptionRepository shipmentTypeOptionRepository;
    private final ShipmentRepository shipmentRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<ShipmentTypeOption> findAll() {
        return shipmentTypeOptionRepository.findAll();
    }

    @Transactional(readOnly = true)
    public ShipmentTypeOption findById(Long id) {
        return shipmentTypeOptionRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Tipo de envío", id));
    }

    @Transactional
    public ShipmentTypeOption create(ShipmentTypeOptionRequest request) {
        ShipmentTypeOption option = new ShipmentTypeOption();
        applyRequest(option, request);
        ShipmentTypeOption saved = shipmentTypeOptionRepository.save(option);
        auditService.log(AuditAction.CREATE, MODULE, "ShipmentTypeOption", saved.getId().toString(), null, saved.getName());
        return saved;
    }

    @Transactional
    public ShipmentTypeOption update(Long id, ShipmentTypeOptionRequest request) {
        ShipmentTypeOption option = findById(id);
        String oldName = option.getName();
        applyRequest(option, request);
        ShipmentTypeOption saved = shipmentTypeOptionRepository.save(option);
        auditService.log(AuditAction.UPDATE, MODULE, "ShipmentTypeOption", id.toString(), oldName, saved.getName());
        return saved;
    }

    /** Igual criterio que ShipmentHolderService: no borrar un "padre" con embarques vigentes. */
    @Transactional
    public void delete(Long id) {
        ShipmentTypeOption option = findById(id);
        if (shipmentRepository.existsByShipmentTypeId(id)) {
            throw new BusinessRuleException("No se puede eliminar un tipo de envío con embarques registrados");
        }
        option.softDelete();
        shipmentTypeOptionRepository.save(option);
        auditService.log(AuditAction.DELETE, MODULE, "ShipmentTypeOption", id.toString(), option.getName(), null);
    }

    private void applyRequest(ShipmentTypeOption option, ShipmentTypeOptionRequest request) {
        option.setName(request.name().trim());
        option.setNotes(request.notes());
    }
}

package com.ramichanstore.backend.modules.shipments.service;

import com.ramichanstore.backend.audit.AuditAction;
import com.ramichanstore.backend.audit.AuditService;
import com.ramichanstore.backend.common.exception.BusinessRuleException;
import com.ramichanstore.backend.common.exception.ResourceNotFoundException;
import com.ramichanstore.backend.modules.shipments.dto.ShipmentHolderRequest;
import com.ramichanstore.backend.modules.shipments.entity.ShipmentHolder;
import com.ramichanstore.backend.modules.shipments.repository.ShipmentHolderRepository;
import com.ramichanstore.backend.modules.shipments.repository.ShipmentRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ShipmentHolderService {

    private static final String MODULE = "SHIPMENTS";

    private final ShipmentHolderRepository shipmentHolderRepository;
    private final ShipmentRepository shipmentRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<ShipmentHolder> findAll() {
        return shipmentHolderRepository.findAll();
    }

    @Transactional(readOnly = true)
    public ShipmentHolder findById(Long id) {
        return shipmentHolderRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Titular", id));
    }

    @Transactional
    public ShipmentHolder create(ShipmentHolderRequest request) {
        ShipmentHolder holder = new ShipmentHolder();
        applyRequest(holder, request);
        ShipmentHolder saved = shipmentHolderRepository.save(holder);
        auditService.log(AuditAction.CREATE, MODULE, "ShipmentHolder", saved.getId().toString(), null, saved.getName());
        return saved;
    }

    @Transactional
    public ShipmentHolder update(Long id, ShipmentHolderRequest request) {
        ShipmentHolder holder = findById(id);
        String oldName = holder.getName();
        applyRequest(holder, request);
        ShipmentHolder saved = shipmentHolderRepository.save(holder);
        auditService.log(AuditAction.UPDATE, MODULE, "ShipmentHolder", id.toString(), oldName, saved.getName());
        return saved;
    }

    /** Igual criterio que RoleService/PreorderService: no borrar un "padre" con hijos vigentes. */
    @Transactional
    public void delete(Long id) {
        ShipmentHolder holder = findById(id);
        if (shipmentRepository.existsByHolderId(id)) {
            throw new BusinessRuleException("No se puede eliminar un titular con embarques registrados");
        }
        holder.softDelete();
        shipmentHolderRepository.save(holder);
        auditService.log(AuditAction.DELETE, MODULE, "ShipmentHolder", id.toString(), holder.getName(), null);
    }

    private void applyRequest(ShipmentHolder holder, ShipmentHolderRequest request) {
        holder.setName(request.name());
        holder.setNotes(request.notes());
    }
}

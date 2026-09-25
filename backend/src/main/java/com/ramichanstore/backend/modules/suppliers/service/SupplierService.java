package com.ramichanstore.backend.modules.suppliers.service;

import com.ramichanstore.backend.audit.AuditAction;
import com.ramichanstore.backend.audit.AuditService;
import com.ramichanstore.backend.common.exception.BusinessRuleException;
import com.ramichanstore.backend.common.exception.ResourceNotFoundException;
import com.ramichanstore.backend.modules.products.repository.ProductRepository;
import com.ramichanstore.backend.modules.suppliers.dto.SupplierRequest;
import com.ramichanstore.backend.modules.suppliers.entity.Supplier;
import com.ramichanstore.backend.modules.suppliers.repository.SupplierRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SupplierService {

    private static final String MODULE = "SUPPLIERS";

    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<Supplier> findAll() {
        return supplierRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Supplier findById(Long id) {
        return supplierRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Proveedor", id));
    }

    @Transactional
    public Supplier create(SupplierRequest request) {
        Supplier supplier = new Supplier();
        applyRequest(supplier, request);
        Supplier saved = supplierRepository.save(supplier);
        auditService.log(AuditAction.CREATE, MODULE, "Supplier", saved.getId().toString(), null, saved.getName());
        return saved;
    }

    @Transactional
    public Supplier update(Long id, SupplierRequest request) {
        Supplier supplier = findById(id);
        String oldName = supplier.getName();
        applyRequest(supplier, request);
        Supplier saved = supplierRepository.save(supplier);
        auditService.log(AuditAction.UPDATE, MODULE, "Supplier", id.toString(), oldName, saved.getName());
        return saved;
    }

    @Transactional
    public void delete(Long id) {
        Supplier supplier = findById(id);
        if (productRepository.existsBySupplierId(id)) {
            throw new BusinessRuleException(
                    "No se puede eliminar el proveedor \"" + supplier.getName() + "\" porque todavía tiene productos asignados");
        }
        supplier.softDelete();
        supplierRepository.save(supplier);
        auditService.log(AuditAction.DELETE, MODULE, "Supplier", id.toString(), supplier.getName(), null);
    }

    private void applyRequest(Supplier supplier, SupplierRequest request) {
        supplier.setName(request.name());
        supplier.setCompany(request.company());
        supplier.setPhone(request.phone());
        supplier.setWhatsapp(request.whatsapp());
        supplier.setEmail(request.email());
        supplier.setCountry(request.country());
        supplier.setAddress(request.address());
        supplier.setNotes(request.notes());
    }
}

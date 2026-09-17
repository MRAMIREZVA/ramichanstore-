package com.ramichanstore.backend.modules.brands.service;

import com.ramichanstore.backend.audit.AuditAction;
import com.ramichanstore.backend.audit.AuditService;
import com.ramichanstore.backend.common.exception.ResourceNotFoundException;
import com.ramichanstore.backend.modules.brands.dto.BrandRequest;
import com.ramichanstore.backend.modules.brands.entity.Brand;
import com.ramichanstore.backend.modules.brands.repository.BrandRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BrandService {

    private static final String MODULE = "PRODUCTS";

    private final BrandRepository brandRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<Brand> findAll() {
        return brandRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Brand findById(Long id) {
        return brandRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Marca", id));
    }

    @Transactional
    public Brand create(BrandRequest request) {
        Brand brand = new Brand();
        brand.setName(request.name());
        brand.setDescription(request.description());
        Brand saved = brandRepository.save(brand);
        auditService.log(AuditAction.CREATE, MODULE, "Brand", saved.getId().toString(), null, saved.getName());
        return saved;
    }

    @Transactional
    public Brand update(Long id, BrandRequest request) {
        Brand brand = findById(id);
        String oldName = brand.getName();
        brand.setName(request.name());
        brand.setDescription(request.description());
        Brand saved = brandRepository.save(brand);
        auditService.log(AuditAction.UPDATE, MODULE, "Brand", id.toString(), oldName, saved.getName());
        return saved;
    }

    @Transactional
    public void delete(Long id) {
        Brand brand = findById(id);
        brand.softDelete();
        brandRepository.save(brand);
        auditService.log(AuditAction.DELETE, MODULE, "Brand", id.toString(), brand.getName(), null);
    }
}

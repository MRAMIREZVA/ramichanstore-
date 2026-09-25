package com.ramichanstore.backend.modules.productlines.service;

import com.ramichanstore.backend.audit.AuditAction;
import com.ramichanstore.backend.audit.AuditService;
import com.ramichanstore.backend.common.exception.BusinessRuleException;
import com.ramichanstore.backend.common.exception.ResourceNotFoundException;
import com.ramichanstore.backend.modules.brands.entity.Brand;
import com.ramichanstore.backend.modules.brands.repository.BrandRepository;
import com.ramichanstore.backend.modules.productlines.dto.ProductLineRequest;
import com.ramichanstore.backend.modules.productlines.dto.ProductLineResponse;
import com.ramichanstore.backend.modules.productlines.entity.ProductLine;
import com.ramichanstore.backend.modules.productlines.repository.ProductLineRepository;
import com.ramichanstore.backend.modules.products.repository.ProductRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProductLineService {

    private static final String MODULE = "PRODUCTS";

    private final ProductLineRepository productLineRepository;
    private final BrandRepository brandRepository;
    private final ProductRepository productRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<ProductLineResponse> findAll() {
        return productLineRepository.findAll().stream().map(ProductLineResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public ProductLine findById(Long id) {
        return productLineRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Línea", id));
    }

    @Transactional
    public ProductLine create(ProductLineRequest request) {
        ProductLine line = new ProductLine();
        line.setName(request.name());
        line.setDescription(request.description());
        line.setBrand(resolveBrand(request.brandId()));
        ProductLine saved = productLineRepository.save(line);
        auditService.log(AuditAction.CREATE, MODULE, "ProductLine", saved.getId().toString(), null, saved.getName());
        return saved;
    }

    @Transactional
    public ProductLine update(Long id, ProductLineRequest request) {
        ProductLine line = findById(id);
        String oldName = line.getName();
        line.setName(request.name());
        line.setDescription(request.description());
        line.setBrand(resolveBrand(request.brandId()));
        ProductLine saved = productLineRepository.save(line);
        auditService.log(AuditAction.UPDATE, MODULE, "ProductLine", id.toString(), oldName, saved.getName());
        return saved;
    }

    @Transactional
    public void delete(Long id) {
        ProductLine line = findById(id);
        if (productRepository.existsByLineId(id)) {
            throw new BusinessRuleException(
                    "No se puede eliminar la línea \"" + line.getName() + "\" porque todavía tiene productos asignados");
        }
        line.softDelete();
        productLineRepository.save(line);
        auditService.log(AuditAction.DELETE, MODULE, "ProductLine", id.toString(), line.getName(), null);
    }

    private Brand resolveBrand(Long brandId) {
        if (brandId == null) {
            return null;
        }
        return brandRepository.findById(brandId).orElseThrow(() -> ResourceNotFoundException.of("Marca", brandId));
    }
}

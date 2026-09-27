package com.ramichanstore.backend.modules.stockalerts.service;

import com.ramichanstore.backend.audit.AuditAction;
import com.ramichanstore.backend.audit.AuditService;
import com.ramichanstore.backend.common.exception.BusinessRuleException;
import com.ramichanstore.backend.common.exception.ResourceNotFoundException;
import com.ramichanstore.backend.modules.products.entity.Product;
import com.ramichanstore.backend.modules.products.service.ProductService;
import com.ramichanstore.backend.modules.stockalerts.dto.StockAlertResponse;
import com.ramichanstore.backend.modules.stockalerts.dto.StockAlertSubmission;
import com.ramichanstore.backend.modules.stockalerts.entity.StockAlertRequest;
import com.ramichanstore.backend.modules.stockalerts.repository.StockAlertRequestRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * "Avísame cuando esté disponible" (Fase 44) — `submit` es la única operación
 * pública. RamichanStore no tiene correo/SMS transaccional (mismo límite ya
 * documentado en Fase 13/18): no hay envío automático cuando vuelve el stock,
 * el admin ve la lista al editar el producto (ProductFormComponent) y escribe
 * por WhatsApp a mano, igual patrón que el resto del proyecto.
 */
@Service
@RequiredArgsConstructor
public class StockAlertService {

    private static final String MODULE = "STOCK_ALERTS";

    private final StockAlertRequestRepository stockAlertRequestRepository;
    private final ProductService productService;
    private final AuditService auditService;

    @Transactional
    public StockAlertResponse submit(StockAlertSubmission request) {
        Product product = productService.findPublicById(request.productId());
        StockAlertRequest alert = new StockAlertRequest();
        alert.setProduct(product);
        alert.setCustomerName(request.customerName());
        alert.setCustomerPhone(request.customerPhone());
        alert.setNotified(false);
        StockAlertRequest saved = stockAlertRequestRepository.save(alert);
        auditService.log(AuditAction.CREATE, MODULE, "StockAlertRequest", saved.getId().toString(), null,
                "producto=%s, cliente=%s, tel=%s".formatted(product.getName(), request.customerName(), request.customerPhone()));
        return StockAlertResponse.from(saved);
    }

    /** Solo los pendientes de un producto — lo que ProductFormComponent muestra al editar. */
    @Transactional(readOnly = true)
    public List<StockAlertResponse> findPendingByProduct(Long productId) {
        return stockAlertRequestRepository.findByProductIdAndNotifiedFalseOrderByCreatedAtDesc(productId).stream()
                .map(StockAlertResponse::from)
                .toList();
    }

    @Transactional
    public StockAlertResponse markNotified(Long id) {
        StockAlertRequest alert = stockAlertRequestRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Aviso de stock", id));
        if (alert.isNotified()) {
            throw new BusinessRuleException("Este aviso ya estaba marcado como notificado");
        }
        alert.setNotified(true);
        alert.setNotifiedAt(LocalDateTime.now());
        StockAlertRequest saved = stockAlertRequestRepository.save(alert);
        auditService.log(AuditAction.UPDATE, MODULE, "StockAlertRequest", id.toString(), "pendiente", "notificado");
        return StockAlertResponse.from(saved);
    }
}

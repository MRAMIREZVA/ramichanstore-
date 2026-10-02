package com.ramichanstore.backend.modules.inventory.service;

import com.ramichanstore.backend.audit.AuditAction;
import com.ramichanstore.backend.audit.AuditService;
import com.ramichanstore.backend.common.exception.BusinessRuleException;
import com.ramichanstore.backend.common.exception.ResourceNotFoundException;
import com.ramichanstore.backend.modules.inventory.dto.InventoryMovementRequest;
import com.ramichanstore.backend.modules.inventory.dto.InventoryMovementResponse;
import com.ramichanstore.backend.modules.inventory.entity.InventoryMovement;
import com.ramichanstore.backend.modules.inventory.entity.MovementType;
import com.ramichanstore.backend.modules.inventory.repository.InventoryMovementRepository;
import com.ramichanstore.backend.modules.inventory.repository.InventoryMovementSpecifications;
import com.ramichanstore.backend.modules.products.dto.ProductImageResponse;
import com.ramichanstore.backend.modules.products.dto.ProductResponse;
import com.ramichanstore.backend.modules.products.entity.Product;
import com.ramichanstore.backend.modules.products.repository.ProductRepository;
import com.ramichanstore.backend.modules.products.service.ProductService;
import com.ramichanstore.backend.security.SecurityUser;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * El stock vivo sigue viviendo en Product.currentStock; este servicio es el
 * único punto que lo modifica fuera de la edición manual del formulario de
 * producto, y siempre deja un InventoryMovement como evidencia (previousStock/
 * newStock) más una entrada de auditoría. Ningún movimiento se edita ni se borra.
 */
@Service
@RequiredArgsConstructor
public class InventoryService {

    private static final String MODULE = "INVENTORY";

    private final InventoryMovementRepository movementRepository;
    private final ProductRepository productRepository;
    private final ProductService productService;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<InventoryMovementResponse> search(Long productId, MovementType type, LocalDate from, LocalDate to, Pageable pageable) {
        List<Specification<InventoryMovement>> specs = Stream.of(
                        InventoryMovementSpecifications.hasProduct(productId),
                        InventoryMovementSpecifications.hasType(type),
                        InventoryMovementSpecifications.createdFrom(from),
                        InventoryMovementSpecifications.createdTo(to))
                .filter(Objects::nonNull)
                .toList();
        Specification<InventoryMovement> spec = specs.isEmpty() ? null : Specification.allOf(specs);
        return movementRepository.findAll(spec, pageable).map(InventoryMovementResponse::from);
    }

    /**
     * Fase 78: mismo fix de N+1/binario de imagen que el catálogo (ver
     * {@code ProductService.resolveImages}) — esta lista llegó a tener 247 productos reales
     * en producción (Fase 34), suficiente para notar el mismo problema si se navegara
     * `product.getImages()` por cada uno.
     */
    @Transactional(readOnly = true)
    public List<ProductResponse> lowStockProducts() {
        List<Product> products = productRepository.findLowStock();
        Map<Long, List<ProductImageResponse>> imagesByProduct = productService.resolveImages(products);
        return products.stream()
                .map(p -> ProductResponse.from(p, imagesByProduct.getOrDefault(p.getId(), List.of())))
                .toList();
    }

    @Transactional
    public InventoryMovementResponse registerMovement(InventoryMovementRequest request, SecurityUser currentUser) {
        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> ResourceNotFoundException.of("Producto", request.productId()));

        int delta = resolveDelta(request.movementType(), request.quantity());
        int previousStock = product.getCurrentStock();
        int newStock = previousStock + delta;
        if (newStock < 0) {
            throw new BusinessRuleException(
                    "Stock insuficiente: el producto '%s' quedaría en %d unidades".formatted(product.getName(), newStock));
        }

        product.setCurrentStock(newStock);
        productRepository.save(product);

        InventoryMovement movement = new InventoryMovement();
        movement.setProduct(product);
        movement.setMovementType(request.movementType());
        movement.setQuantity(delta);
        movement.setPreviousStock(previousStock);
        movement.setNewStock(newStock);
        movement.setReason(request.reason());
        movement.setObservation(request.observation());
        movement.setUserId(currentUser.getId());
        movement.setUsername(currentUser.getUsername());
        InventoryMovement saved = movementRepository.save(movement);

        auditService.log(AuditAction.UPDATE, MODULE, "Product.stock", product.getId().toString(),
                "stock=" + previousStock,
                "stock=%d (movimiento %s, %s)".formatted(newStock, request.movementType(), request.reason()));

        return InventoryMovementResponse.from(saved);
    }

    /** Traduce tipo + cantidad ingresada a un delta con signo, validando la regla de cada tipo. */
    private int resolveDelta(MovementType type, int quantity) {
        if (type == MovementType.AJUSTE) {
            if (quantity == 0) {
                throw new BusinessRuleException("La cantidad del ajuste no puede ser cero");
            }
            return quantity;
        }
        if (quantity <= 0) {
            throw new BusinessRuleException("La cantidad debe ser mayor a cero");
        }
        return type.increasesStock() ? quantity : -quantity;
    }
}

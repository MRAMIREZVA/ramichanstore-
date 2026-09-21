package com.ramichanstore.backend.modules.loyalty.service;

import com.ramichanstore.backend.audit.AuditAction;
import com.ramichanstore.backend.audit.AuditService;
import com.ramichanstore.backend.common.exception.BusinessRuleException;
import com.ramichanstore.backend.common.exception.ResourceNotFoundException;
import com.ramichanstore.backend.modules.customers.entity.Customer;
import com.ramichanstore.backend.modules.customers.repository.CustomerRepository;
import com.ramichanstore.backend.modules.loyalty.dto.LoyaltyBalanceResponse;
import com.ramichanstore.backend.modules.loyalty.dto.LoyaltyMovementRequest;
import com.ramichanstore.backend.modules.loyalty.dto.LoyaltyMovementResponse;
import com.ramichanstore.backend.modules.loyalty.entity.LoyaltyMovementType;
import com.ramichanstore.backend.modules.loyalty.entity.LoyaltyPointMovement;
import com.ramichanstore.backend.modules.loyalty.repository.LoyaltyPointMovementRepository;
import com.ramichanstore.backend.modules.loyalty.repository.LoyaltyPointMovementSpecifications;
import com.ramichanstore.backend.modules.sales.entity.Sale;
import com.ramichanstore.backend.security.SecurityUser;
import java.util.List;
import java.util.Objects;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Único punto que escribe en el ledger de puntos. El saldo de un cliente
 * SIEMPRE se calcula sumando sus movimientos (nunca un contador guardado).
 */
@Service
@RequiredArgsConstructor
public class LoyaltyService {

    private static final String MODULE = "LOYALTY";

    private final LoyaltyPointMovementRepository movementRepository;
    private final CustomerRepository customerRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<LoyaltyMovementResponse> search(Long customerId, LoyaltyMovementType type, Pageable pageable) {
        List<Specification<LoyaltyPointMovement>> specs = Stream.of(
                        LoyaltyPointMovementSpecifications.hasCustomer(customerId),
                        LoyaltyPointMovementSpecifications.hasType(type))
                .filter(Objects::nonNull)
                .toList();
        Specification<LoyaltyPointMovement> spec = specs.isEmpty() ? null : Specification.allOf(specs);
        return movementRepository.findAll(spec, pageable).map(LoyaltyMovementResponse::from);
    }

    @Transactional(readOnly = true)
    public LoyaltyBalanceResponse getBalance(Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> ResourceNotFoundException.of("Cliente", customerId));
        return new LoyaltyBalanceResponse(customer.getId(), customer.getFullName(), movementRepository.sumBalance(customerId));
    }

    /** Endpoint manual: CANJE, AJUSTE_MANUAL o BONIFICACION. COMPRA es exclusivo de SaleService. */
    @Transactional
    public LoyaltyMovementResponse registerMovement(LoyaltyMovementRequest request, SecurityUser currentUser) {
        if (request.movementType() == LoyaltyMovementType.COMPRA) {
            throw new BusinessRuleException("Los puntos por compra los genera automáticamente el registro de la venta");
        }
        Customer customer = customerRepository.findById(request.customerId())
                .orElseThrow(() -> ResourceNotFoundException.of("Cliente", request.customerId()));

        int delta = resolveDelta(request.movementType(), request.points());
        if (delta < 0) {
            int balance = movementRepository.sumBalance(customer.getId());
            if (balance + delta < 0) {
                throw new BusinessRuleException(
                        "Saldo insuficiente: el cliente tiene %d punto(s) disponible(s)".formatted(balance));
            }
        }

        LoyaltyPointMovement movement = new LoyaltyPointMovement();
        movement.setCustomer(customer);
        movement.setMovementType(request.movementType());
        movement.setPoints(delta);
        movement.setReason(request.reason());
        movement.setUserId(currentUser.getId());
        movement.setUsername(currentUser.getUsername());
        LoyaltyPointMovement saved = movementRepository.save(movement);

        auditService.log(AuditAction.CREATE, MODULE, "LoyaltyPointMovement", saved.getId().toString(), null,
                "cliente=%s, tipo=%s, puntos=%d".formatted(customer.getFullName(), request.movementType(), delta));

        return LoyaltyMovementResponse.from(saved);
    }

    /** Llamado por SaleService al registrar una venta con cliente y puntos generados > 0. */
    @Transactional
    public void registerSaleEarnedPoints(Sale sale, SecurityUser currentUser) {
        if (sale.getCustomer() == null || sale.getPointsGenerated() <= 0) {
            return;
        }
        LoyaltyPointMovement movement = new LoyaltyPointMovement();
        movement.setCustomer(sale.getCustomer());
        movement.setMovementType(LoyaltyMovementType.COMPRA);
        movement.setPoints(sale.getPointsGenerated());
        movement.setReason("Compra en venta #" + sale.getId());
        movement.setSale(sale);
        movement.setUserId(currentUser.getId());
        movement.setUsername(currentUser.getUsername());
        movementRepository.save(movement);
    }

    /** Llamado por SaleService al cancelar una venta que había generado puntos. */
    @Transactional
    public void reverseSaleEarnedPoints(Sale sale, SecurityUser currentUser) {
        if (sale.getCustomer() == null || sale.getPointsGenerated() <= 0) {
            return;
        }
        LoyaltyPointMovement movement = new LoyaltyPointMovement();
        movement.setCustomer(sale.getCustomer());
        movement.setMovementType(LoyaltyMovementType.AJUSTE_MANUAL);
        movement.setPoints(-sale.getPointsGenerated());
        movement.setReason("Reversión por cancelación de venta #" + sale.getId());
        movement.setSale(sale);
        movement.setUserId(currentUser.getId());
        movement.setUsername(currentUser.getUsername());
        movementRepository.save(movement);
    }

    private int resolveDelta(LoyaltyMovementType type, int points) {
        if (type == LoyaltyMovementType.AJUSTE_MANUAL) {
            if (points == 0) {
                throw new BusinessRuleException("El ajuste no puede ser cero");
            }
            return points;
        }
        if (points <= 0) {
            throw new BusinessRuleException("Los puntos deben ser mayores a cero");
        }
        return type.increasesBalance() ? points : -points;
    }
}

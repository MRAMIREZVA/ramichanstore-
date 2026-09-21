package com.ramichanstore.backend.modules.separations.service;

import com.ramichanstore.backend.audit.AuditAction;
import com.ramichanstore.backend.audit.AuditService;
import com.ramichanstore.backend.common.exception.BusinessRuleException;
import com.ramichanstore.backend.common.exception.ResourceNotFoundException;
import com.ramichanstore.backend.modules.customers.entity.Customer;
import com.ramichanstore.backend.modules.customers.repository.CustomerRepository;
import com.ramichanstore.backend.modules.inventory.dto.InventoryMovementRequest;
import com.ramichanstore.backend.modules.inventory.entity.MovementType;
import com.ramichanstore.backend.modules.inventory.service.InventoryService;
import com.ramichanstore.backend.modules.products.entity.Product;
import com.ramichanstore.backend.modules.products.repository.ProductRepository;
import com.ramichanstore.backend.modules.sales.entity.PaymentStatus;
import com.ramichanstore.backend.modules.separations.dto.PaymentRequest;
import com.ramichanstore.backend.modules.separations.dto.PaymentResponse;
import com.ramichanstore.backend.modules.separations.dto.SeparationRequest;
import com.ramichanstore.backend.modules.separations.dto.SeparationResponse;
import com.ramichanstore.backend.modules.separations.entity.Payment;
import com.ramichanstore.backend.modules.separations.entity.Separation;
import com.ramichanstore.backend.modules.separations.repository.PaymentRepository;
import com.ramichanstore.backend.modules.separations.repository.SeparationRepository;
import com.ramichanstore.backend.modules.separations.repository.SeparationSpecifications;
import com.ramichanstore.backend.security.SecurityUser;
import java.math.BigDecimal;
import java.time.LocalDate;
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
 * Una separación reserva stock real (a diferencia de una preventa): crearla
 * descuenta stock vía {@link InventoryService} (tipo SEPARACION); cancelarla
 * lo devuelve (tipo DEVOLUCION). amountPaid/balanceDue se calculan siempre
 * sumando `payments`, nunca se guardan como contador.
 */
@Service
@RequiredArgsConstructor
public class SeparationService {

    private static final String MODULE = "SEPARATIONS";

    private final SeparationRepository separationRepository;
    private final PaymentRepository paymentRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final InventoryService inventoryService;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<SeparationResponse> search(Long customerId, PaymentStatus status, LocalDate from, LocalDate to, Pageable pageable) {
        List<Specification<Separation>> specs = Stream.of(
                        SeparationSpecifications.hasCustomer(customerId),
                        SeparationSpecifications.hasStatus(status),
                        SeparationSpecifications.separationDateFrom(from),
                        SeparationSpecifications.separationDateTo(to))
                .filter(Objects::nonNull)
                .toList();
        Specification<Separation> spec = specs.isEmpty() ? null : Specification.allOf(specs);
        return separationRepository.findAll(spec, pageable)
                .map(s -> SeparationResponse.from(s, paymentRepository.sumPaidAmount(s.getId())));
    }

    @Transactional(readOnly = true)
    public SeparationResponse findResponseById(Long id) {
        Separation separation = findById(id);
        return SeparationResponse.from(separation, paymentRepository.sumPaidAmount(id));
    }

    @Transactional(readOnly = true)
    public Separation findById(Long id) {
        return separationRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Separación", id));
    }

    @Transactional
    public SeparationResponse create(SeparationRequest request, SecurityUser currentUser) {
        Customer customer = customerRepository.findById(request.customerId())
                .orElseThrow(() -> ResourceNotFoundException.of("Cliente", request.customerId()));
        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> ResourceNotFoundException.of("Producto", request.productId()));

        if (product.getCurrentStock() < request.quantity()) {
            throw new BusinessRuleException(
                    "Stock insuficiente para '%s': disponible %d, solicitado %d"
                            .formatted(product.getName(), product.getCurrentStock(), request.quantity()));
        }
        if (!request.limitDate().isAfter(request.separationDate())) {
            throw new BusinessRuleException("La fecha límite debe ser posterior a la fecha de separación");
        }

        Separation separation = new Separation();
        separation.setCustomer(customer);
        separation.setProduct(product);
        separation.setQuantity(request.quantity());
        separation.setTotalPrice(request.totalPrice());
        separation.setSeparationDate(request.separationDate());
        separation.setLimitDate(request.limitDate());
        separation.setStatus(PaymentStatus.PENDING);
        separation.setNotes(request.notes());
        Separation saved = separationRepository.save(separation);

        inventoryService.registerMovement(
                new InventoryMovementRequest(product.getId(), MovementType.SEPARACION, request.quantity(),
                        "Separación #" + saved.getId() + " para " + customer.getFullName(), null),
                currentUser);

        auditService.log(AuditAction.CREATE, MODULE, "Separation", saved.getId().toString(), null, summarize(saved, BigDecimal.ZERO));
        return SeparationResponse.from(saved, BigDecimal.ZERO);
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> listPayments(Long separationId) {
        findById(separationId);
        return paymentRepository.findBySeparationIdOrderByCreatedAtDesc(separationId).stream()
                .map(PaymentResponse::from)
                .toList();
    }

    @Transactional
    public PaymentResponse registerPayment(Long separationId, PaymentRequest request, SecurityUser currentUser) {
        Separation separation = findById(separationId);
        if (separation.getStatus() == PaymentStatus.CANCELLED) {
            throw new BusinessRuleException("No se pueden registrar abonos en una separación cancelada");
        }
        if (separation.getStatus() == PaymentStatus.PAID) {
            throw new BusinessRuleException("Esta separación ya está pagada en su totalidad");
        }

        BigDecimal alreadyPaid = paymentRepository.sumPaidAmount(separationId);
        BigDecimal balanceDue = separation.getTotalPrice().subtract(alreadyPaid);
        if (request.amount().compareTo(balanceDue) > 0) {
            throw new BusinessRuleException(
                    "El abono (%s) supera el saldo pendiente (%s)".formatted(request.amount(), balanceDue));
        }

        Payment payment = new Payment();
        payment.setSeparation(separation);
        payment.setAmount(request.amount());
        payment.setPaymentMethod(request.paymentMethod());
        payment.setPaymentDate(request.paymentDate());
        payment.setNotes(request.notes());
        payment.setUserId(currentUser.getId());
        payment.setUsername(currentUser.getUsername());
        Payment savedPayment = paymentRepository.save(payment);

        BigDecimal newTotalPaid = alreadyPaid.add(request.amount());
        separation.setStatus(newTotalPaid.compareTo(separation.getTotalPrice()) >= 0 ? PaymentStatus.PAID : PaymentStatus.PARTIAL);
        separationRepository.save(separation);

        auditService.log(AuditAction.CREATE, MODULE, "Payment", savedPayment.getId().toString(), null,
                "separacion=%d, monto=%s, saldoRestante=%s".formatted(separationId, request.amount(),
                        separation.getTotalPrice().subtract(newTotalPaid)));

        return PaymentResponse.from(savedPayment);
    }

    @Transactional
    public SeparationResponse cancel(Long id, String reason, SecurityUser currentUser) {
        Separation separation = findById(id);
        if (separation.getStatus() == PaymentStatus.CANCELLED) {
            throw new BusinessRuleException("La separación ya está cancelada");
        }
        if (separation.getStatus() == PaymentStatus.PAID) {
            throw new BusinessRuleException("No se puede cancelar una separación ya pagada en su totalidad");
        }

        inventoryService.registerMovement(
                new InventoryMovementRequest(separation.getProduct().getId(), MovementType.DEVOLUCION, separation.getQuantity(),
                        "Cancelación de separación #" + separation.getId() + ": " + reason, null),
                currentUser);

        BigDecimal paid = paymentRepository.sumPaidAmount(id);
        String before = summarize(separation, paid);
        separation.setStatus(PaymentStatus.CANCELLED);
        Separation saved = separationRepository.save(separation);

        auditService.log(AuditAction.UPDATE, MODULE, "Separation", id.toString(), before, "CANCELLED: " + reason);
        return SeparationResponse.from(saved, paid);
    }

    private String summarize(Separation s, BigDecimal amountPaid) {
        return "producto=%s, total=%s, pagado=%s, estado=%s"
                .formatted(s.getProduct().getSku(), s.getTotalPrice(), amountPaid, s.getStatus());
    }
}

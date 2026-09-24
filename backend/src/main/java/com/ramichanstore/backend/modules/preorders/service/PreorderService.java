package com.ramichanstore.backend.modules.preorders.service;

import com.ramichanstore.backend.audit.AuditAction;
import com.ramichanstore.backend.audit.AuditService;
import com.ramichanstore.backend.common.exception.BusinessRuleException;
import com.ramichanstore.backend.common.exception.ResourceNotFoundException;
import com.ramichanstore.backend.modules.customers.entity.Customer;
import com.ramichanstore.backend.modules.customers.repository.CustomerRepository;
import com.ramichanstore.backend.modules.preorders.dto.CustomerReservationResponse;
import com.ramichanstore.backend.modules.preorders.dto.PreorderCustomerPaymentRequest;
import com.ramichanstore.backend.modules.preorders.dto.PreorderCustomerPaymentResponse;
import com.ramichanstore.backend.modules.preorders.dto.PreorderCustomerRequest;
import com.ramichanstore.backend.modules.preorders.dto.PreorderCustomerResponse;
import com.ramichanstore.backend.modules.preorders.dto.PreorderRequest;
import com.ramichanstore.backend.modules.preorders.dto.PreorderResponse;
import com.ramichanstore.backend.modules.preorders.entity.Preorder;
import com.ramichanstore.backend.modules.preorders.entity.PreorderCustomer;
import com.ramichanstore.backend.modules.preorders.entity.PreorderCustomerPayment;
import com.ramichanstore.backend.modules.preorders.entity.PreorderStatus;
import com.ramichanstore.backend.modules.preorders.repository.PreorderCustomerPaymentRepository;
import com.ramichanstore.backend.modules.preorders.repository.PreorderCustomerRepository;
import com.ramichanstore.backend.modules.preorders.repository.PreorderCustomerSpecifications;
import com.ramichanstore.backend.modules.preorders.repository.PreorderRepository;
import com.ramichanstore.backend.modules.preorders.repository.PreorderSpecifications;
import com.ramichanstore.backend.modules.products.entity.Product;
import com.ramichanstore.backend.modules.products.repository.ProductRepository;
import com.ramichanstore.backend.security.SecurityUser;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PreorderService {

    private static final String MODULE = "PREORDERS";

    private final PreorderRepository preorderRepository;
    private final PreorderCustomerRepository preorderCustomerRepository;
    private final PreorderCustomerPaymentRepository preorderCustomerPaymentRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<PreorderResponse> search(String term, PreorderStatus status, Pageable pageable) {
        List<Specification<Preorder>> specs = Stream.of(
                        PreorderSpecifications.search(term),
                        PreorderSpecifications.hasStatus(status))
                .filter(Objects::nonNull)
                .toList();
        Specification<Preorder> spec = specs.isEmpty() ? null : Specification.allOf(specs);
        return preorderRepository.findAll(spec, pageable)
                .map(p -> PreorderResponse.from(p, preorderCustomerRepository.sumReservedQuantity(p.getId())));
    }

    @Transactional(readOnly = true)
    public PreorderResponse findResponseById(Long id) {
        Preorder preorder = findById(id);
        return PreorderResponse.from(preorder, preorderCustomerRepository.sumReservedQuantity(id));
    }

    @Transactional(readOnly = true)
    public Preorder findById(Long id) {
        return preorderRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Preventa", id));
    }

    @Transactional
    public PreorderResponse create(PreorderRequest request) {
        Preorder preorder = new Preorder();
        applyRequest(preorder, request);
        Preorder saved = preorderRepository.save(preorder);
        auditService.log(AuditAction.CREATE, MODULE, "Preorder", saved.getId().toString(), null, summarize(saved));
        return PreorderResponse.from(saved, 0);
    }

    @Transactional
    public PreorderResponse update(Long id, PreorderRequest request) {
        Preorder preorder = findById(id);
        int reserved = preorderCustomerRepository.sumReservedQuantity(id);
        if (request.availableQuantity() < reserved) {
            throw new BusinessRuleException(
                    "La cantidad disponible (%d) no puede ser menor a lo ya reservado (%d)".formatted(request.availableQuantity(), reserved));
        }
        String before = summarize(preorder);
        applyRequest(preorder, request);
        Preorder saved = preorderRepository.save(preorder);
        auditService.log(AuditAction.UPDATE, MODULE, "Preorder", id.toString(), before, summarize(saved));
        return PreorderResponse.from(saved, reserved);
    }

    @Transactional
    public void delete(Long id) {
        Preorder preorder = findById(id);
        if (!preorderCustomerRepository.findByPreorderIdOrderByCreatedAtDesc(id).isEmpty()) {
            throw new BusinessRuleException(
                    "No se puede eliminar una preventa con reservas registradas — cancela o reasigna las reservas primero");
        }
        preorder.softDelete();
        preorderRepository.save(preorder);
        auditService.log(AuditAction.DELETE, MODULE, "Preorder", id.toString(), summarize(preorder), null);
    }

    @Transactional(readOnly = true)
    public List<PreorderCustomerResponse> listReservations(Long preorderId) {
        findById(preorderId);
        return preorderCustomerRepository.findByPreorderIdOrderByCreatedAtDesc(preorderId).stream()
                .map(pc -> PreorderCustomerResponse.from(pc, preorderCustomerPaymentRepository.sumPaidAmount(pc.getId())))
                .toList();
    }

    /**
     * Para la pantalla "Pedidos → Preventas" (todas las reservas de todas las
     * campañas juntas, ver sección 9 del roadmap). Igual que
     * {@code PortalService.myReservations}: omite en silencio cualquier reserva
     * huérfana (preventa ya eliminada) en vez de tumbar la página completa —
     * por eso no se puede usar {@code Page.map} directo, que propaga la excepción.
     */
    @Transactional(readOnly = true)
    public Page<PreorderCustomerResponse> searchReservations(
            String term, PreorderStatus status, LocalDate from, LocalDate to, Pageable pageable) {
        List<Specification<PreorderCustomer>> specs = Stream.of(
                        PreorderCustomerSpecifications.search(term),
                        PreorderCustomerSpecifications.hasStatus(status),
                        PreorderCustomerSpecifications.createdFrom(from),
                        PreorderCustomerSpecifications.createdTo(to))
                .filter(Objects::nonNull)
                .toList();
        Specification<PreorderCustomer> spec = specs.isEmpty() ? null : Specification.allOf(specs);
        Page<PreorderCustomer> page = preorderCustomerRepository.findAll(spec, pageable);
        List<PreorderCustomerResponse> content = new ArrayList<>();
        for (PreorderCustomer pc : page.getContent()) {
            try {
                content.add(PreorderCustomerResponse.from(pc, preorderCustomerPaymentRepository.sumPaidAmount(pc.getId())));
            } catch (EntityNotFoundException ignored) {
                // ver PortalService.myReservations: mismo caso defensivo.
            }
        }
        return new PageImpl<>(content, pageable, page.getTotalElements());
    }

    /**
     * Para la ficha del cliente en el admin (a diferencia de {@link #listReservations},
     * que es por campaña). Igual que {@code PortalService.myReservations}, omite en
     * silencio cualquier reserva cuya preventa haya quedado huérfana de antes de que
     * {@link #delete} bloqueara ese caso — no debería pasar con datos nuevos.
     */
    @Transactional(readOnly = true)
    public List<CustomerReservationResponse> listReservationsByCustomer(Long customerId) {
        List<CustomerReservationResponse> reservations = new ArrayList<>();
        for (PreorderCustomer pc : preorderCustomerRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)) {
            try {
                reservations.add(CustomerReservationResponse.from(pc));
            } catch (EntityNotFoundException ignored) {
                // ver PortalService.myReservations: mismo caso defensivo.
            }
        }
        return reservations;
    }

    @Transactional
    public PreorderCustomerResponse addReservation(Long preorderId, PreorderCustomerRequest request, SecurityUser currentUser) {
        Preorder preorder = findById(preorderId);
        Customer customer = customerRepository.findById(request.customerId())
                .orElseThrow(() -> ResourceNotFoundException.of("Cliente", request.customerId()));

        int alreadyReserved = preorderCustomerRepository.sumReservedQuantity(preorderId);
        int availableSlots = preorder.getAvailableQuantity() - alreadyReserved;
        if (request.quantity() > availableSlots) {
            throw new BusinessRuleException(
                    "No hay cupos suficientes: quedan %d disponible(s) y se pidieron %d".formatted(availableSlots, request.quantity()));
        }
        validateMinDeposit(preorder, request);

        PreorderCustomer reservation = new PreorderCustomer();
        reservation.setPreorder(preorder);
        reservation.setCustomer(customer);
        reservation.setQuantity(request.quantity());
        reservation.setDepositAmount(request.depositAmount());
        // Precio de catálogo vigente si no se especifica uno propio (ver Javadoc de PreorderCustomerRequest).
        reservation.setUnitPrice(request.unitPrice() != null ? request.unitPrice() : preorder.getProduct().getSalePrice());
        reservation.setNotes(request.notes());
        PreorderCustomer saved = preorderCustomerRepository.save(reservation);

        // El depósito ingresado acá ES el primer abono del ledger — así "total pagado"
        // siempre es SUM(preorder_customer_payments), sin casos especiales.
        BigDecimal amountPaid = BigDecimal.ZERO;
        if (request.depositAmount().compareTo(BigDecimal.ZERO) > 0) {
            PreorderCustomerPayment initialPayment = new PreorderCustomerPayment();
            initialPayment.setPreorderCustomer(saved);
            initialPayment.setAmount(request.depositAmount());
            initialPayment.setPaymentMethod(request.paymentMethod());
            initialPayment.setPaymentDate(LocalDate.now());
            initialPayment.setNotes("Depósito inicial de la reserva");
            initialPayment.setUserId(currentUser.getId());
            initialPayment.setUsername(currentUser.getUsername());
            preorderCustomerPaymentRepository.save(initialPayment);
            amountPaid = request.depositAmount();
        }

        auditService.log(AuditAction.CREATE, MODULE, "PreorderCustomer", saved.getId().toString(), null,
                "cliente=%s, cantidad=%d, deposito=%s".formatted(customer.getFullName(), request.quantity(), request.depositAmount()));

        return PreorderCustomerResponse.from(saved, amountPaid);
    }

    @Transactional(readOnly = true)
    public List<PreorderCustomerPaymentResponse> listPayments(Long reservationId) {
        findReservationById(reservationId);
        return preorderCustomerPaymentRepository.findByPreorderCustomerIdOrderByCreatedAtDesc(reservationId).stream()
                .map(PreorderCustomerPaymentResponse::from)
                .toList();
    }

    @Transactional
    public PreorderCustomerPaymentResponse registerPayment(Long reservationId, PreorderCustomerPaymentRequest request, SecurityUser currentUser) {
        PreorderCustomer reservation = findReservationById(reservationId);

        BigDecimal alreadyPaid = preorderCustomerPaymentRepository.sumPaidAmount(reservationId);
        BigDecimal totalPrice = reservation.getUnitPrice().multiply(BigDecimal.valueOf(reservation.getQuantity()));
        BigDecimal balanceDue = totalPrice.subtract(alreadyPaid);
        if (balanceDue.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Esta reserva ya está pagada en su totalidad");
        }
        if (request.amount().compareTo(balanceDue) > 0) {
            throw new BusinessRuleException(
                    "El abono (%s) supera el saldo pendiente (%s)".formatted(request.amount(), balanceDue));
        }

        PreorderCustomerPayment payment = new PreorderCustomerPayment();
        payment.setPreorderCustomer(reservation);
        payment.setAmount(request.amount());
        payment.setPaymentMethod(request.paymentMethod());
        payment.setPaymentDate(request.paymentDate());
        payment.setNotes(request.notes());
        payment.setUserId(currentUser.getId());
        payment.setUsername(currentUser.getUsername());
        PreorderCustomerPayment saved = preorderCustomerPaymentRepository.save(payment);

        auditService.log(AuditAction.CREATE, MODULE, "PreorderCustomerPayment", saved.getId().toString(), null,
                "reserva=%d, monto=%s, saldoRestante=%s".formatted(reservationId, request.amount(),
                        balanceDue.subtract(request.amount())));

        return PreorderCustomerPaymentResponse.from(saved);
    }

    /**
     * Corrige el precio unitario de una reserva ya creada (ej. se tipeó mal, o se decide dar el
     * precio de preventa a un cliente que ya había reservado al de catálogo). No bloquea si ya
     * hay abonos registrados — el saldo simplemente se recalcula con el nuevo precio (puede
     * quedar en negativo si el cliente ya pagó de más respecto al precio corregido, igual que
     * un ajuste de precio en una venta puede dejar puntos de más/de menos).
     */
    @Transactional
    public PreorderCustomerResponse updateUnitPrice(Long reservationId, BigDecimal unitPrice) {
        PreorderCustomer reservation = findReservationById(reservationId);
        BigDecimal before = reservation.getUnitPrice();
        reservation.setUnitPrice(unitPrice);
        PreorderCustomer saved = preorderCustomerRepository.save(reservation);

        auditService.log(AuditAction.UPDATE, MODULE, "PreorderCustomer", reservationId.toString(),
                "precio=" + before, "precio=" + unitPrice);

        BigDecimal amountPaid = preorderCustomerPaymentRepository.sumPaidAmount(reservationId);
        return PreorderCustomerResponse.from(saved, amountPaid);
    }

    private PreorderCustomer findReservationById(Long reservationId) {
        return preorderCustomerRepository.findById(reservationId)
                .orElseThrow(() -> ResourceNotFoundException.of("Reserva", reservationId));
    }

    @Transactional
    public void cancelReservation(Long preorderId, Long reservationId) {
        findById(preorderId);
        PreorderCustomer reservation = preorderCustomerRepository.findById(reservationId)
                .orElseThrow(() -> ResourceNotFoundException.of("Reserva", reservationId));
        if (!reservation.getPreorder().getId().equals(preorderId)) {
            throw new ResourceNotFoundException("La reserva no pertenece a esta preventa");
        }
        reservation.softDelete();
        preorderCustomerRepository.save(reservation);
        auditService.log(AuditAction.DELETE, MODULE, "PreorderCustomer", reservationId.toString(),
                "cliente=%s, cantidad=%d".formatted(reservation.getCustomer().getFullName(), reservation.getQuantity()), null);
    }

    private void validateMinDeposit(Preorder preorder, PreorderCustomerRequest request) {
        var minRequired = preorder.getMinDepositAmount().multiply(java.math.BigDecimal.valueOf(request.quantity()));
        if (request.depositAmount().compareTo(minRequired) < 0) {
            throw new BusinessRuleException(
                    "El monto de separación debe ser al menos %s para %d unidad(es)".formatted(minRequired, request.quantity()));
        }
    }

    private void applyRequest(Preorder preorder, PreorderRequest request) {
        preorder.setProduct(resolveProduct(request.productId()));
        preorder.setMinDepositAmount(request.minDepositAmount());
        preorder.setStartDate(request.startDate());
        preorder.setLimitDate(request.limitDate());
        preorder.setEstimatedArrivalDate(request.estimatedArrivalDate());
        preorder.setAvailableQuantity(request.availableQuantity());
        preorder.setStatus(request.status());
        preorder.setNotes(request.notes());
    }

    private Product resolveProduct(Long id) {
        return productRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Producto", id));
    }

    private String summarize(Preorder preorder) {
        return "producto=%s, cupos=%d, estado=%s"
                .formatted(preorder.getProduct().getSku(), preorder.getAvailableQuantity(), preorder.getStatus());
    }
}

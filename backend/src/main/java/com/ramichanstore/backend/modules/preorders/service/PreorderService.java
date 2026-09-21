package com.ramichanstore.backend.modules.preorders.service;

import com.ramichanstore.backend.audit.AuditAction;
import com.ramichanstore.backend.audit.AuditService;
import com.ramichanstore.backend.common.exception.BusinessRuleException;
import com.ramichanstore.backend.common.exception.ResourceNotFoundException;
import com.ramichanstore.backend.modules.customers.entity.Customer;
import com.ramichanstore.backend.modules.customers.repository.CustomerRepository;
import com.ramichanstore.backend.modules.preorders.dto.CustomerReservationResponse;
import com.ramichanstore.backend.modules.preorders.dto.PreorderCustomerRequest;
import com.ramichanstore.backend.modules.preorders.dto.PreorderCustomerResponse;
import com.ramichanstore.backend.modules.preorders.dto.PreorderRequest;
import com.ramichanstore.backend.modules.preorders.dto.PreorderResponse;
import com.ramichanstore.backend.modules.preorders.entity.Preorder;
import com.ramichanstore.backend.modules.preorders.entity.PreorderCustomer;
import com.ramichanstore.backend.modules.preorders.entity.PreorderStatus;
import com.ramichanstore.backend.modules.preorders.repository.PreorderCustomerRepository;
import com.ramichanstore.backend.modules.preorders.repository.PreorderCustomerSpecifications;
import com.ramichanstore.backend.modules.preorders.repository.PreorderRepository;
import com.ramichanstore.backend.modules.preorders.repository.PreorderSpecifications;
import com.ramichanstore.backend.modules.products.entity.Product;
import com.ramichanstore.backend.modules.products.repository.ProductRepository;
import jakarta.persistence.EntityNotFoundException;
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
                .map(PreorderCustomerResponse::from)
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
                content.add(PreorderCustomerResponse.from(pc));
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
    public PreorderCustomerResponse addReservation(Long preorderId, PreorderCustomerRequest request) {
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
        reservation.setNotes(request.notes());
        PreorderCustomer saved = preorderCustomerRepository.save(reservation);

        auditService.log(AuditAction.CREATE, MODULE, "PreorderCustomer", saved.getId().toString(), null,
                "cliente=%s, cantidad=%d, deposito=%s".formatted(customer.getFullName(), request.quantity(), request.depositAmount()));

        return PreorderCustomerResponse.from(saved);
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

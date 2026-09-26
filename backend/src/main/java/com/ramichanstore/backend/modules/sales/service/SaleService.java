package com.ramichanstore.backend.modules.sales.service;

import com.ramichanstore.backend.audit.AuditAction;
import com.ramichanstore.backend.audit.AuditService;
import com.ramichanstore.backend.common.exception.BusinessRuleException;
import com.ramichanstore.backend.common.exception.ResourceNotFoundException;
import com.ramichanstore.backend.modules.customers.entity.Customer;
import com.ramichanstore.backend.modules.customers.repository.CustomerRepository;
import com.ramichanstore.backend.modules.inventory.dto.InventoryMovementRequest;
import com.ramichanstore.backend.modules.inventory.entity.MovementType;
import com.ramichanstore.backend.modules.inventory.service.InventoryService;
import com.ramichanstore.backend.modules.loyalty.service.LoyaltyService;
import com.ramichanstore.backend.modules.products.entity.Product;
import com.ramichanstore.backend.modules.products.repository.ProductRepository;
import com.ramichanstore.backend.modules.sales.dto.AddSaleItemRequest;
import com.ramichanstore.backend.modules.sales.dto.PaymentRequest;
import com.ramichanstore.backend.modules.sales.dto.PaymentResponse;
import com.ramichanstore.backend.modules.sales.dto.SaleItemRequest;
import com.ramichanstore.backend.modules.sales.dto.SaleRequest;
import com.ramichanstore.backend.modules.sales.dto.SaleResponse;
import com.ramichanstore.backend.modules.sales.dto.UpdateSaleItemsRequest;
import com.ramichanstore.backend.modules.sales.entity.Payment;
import com.ramichanstore.backend.modules.sales.entity.PaymentMethod;
import com.ramichanstore.backend.modules.sales.entity.PaymentStatus;
import com.ramichanstore.backend.modules.sales.entity.Sale;
import com.ramichanstore.backend.modules.sales.entity.SaleDetail;
import com.ramichanstore.backend.modules.sales.entity.SaleType;
import com.ramichanstore.backend.modules.sales.repository.PaymentRepository;
import com.ramichanstore.backend.modules.sales.repository.SaleRepository;
import com.ramichanstore.backend.modules.sales.repository.SaleSpecifications;
import com.ramichanstore.backend.modules.settings.service.SettingService;
import com.ramichanstore.backend.security.SecurityUser;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Cubre ambos tipos de compra que antes eran módulos separados: {@code VENTA} (pago de una
 * sola vez, genera puntos) y {@code SEPARACION} (producto ya en stock pagado en abonos vía el
 * ledger {@link Payment}, nunca genera puntos). La fusión es de datos/código, NO de reglas de
 * negocio — cada método que se comporta distinto según el tipo lo deja explícito con un
 * {@code if (sale.getType() == SaleType.VENTA)} en vez de esconder la diferencia.
 *
 * <p>Total, costo, ganancia y puntos generados SIEMPRE se calculan aquí, nunca se aceptan
 * editados desde el frontend. El descuento de stock pasa por
 * {@link InventoryService#registerMovement} (tipo VENTA o SEPARACION según corresponda) para
 * que quede en el kardex — nunca se toca {@code product.currentStock} directamente.</p>
 */
@Service
@RequiredArgsConstructor
public class SaleService {

    private final SaleRepository saleRepository;
    private final PaymentRepository paymentRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final InventoryService inventoryService;
    private final SettingService settingService;
    private final LoyaltyService loyaltyService;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<SaleResponse> search(SaleType type, Long customerId, PaymentStatus status, PaymentMethod method,
            LocalDate from, LocalDate to, Pageable pageable) {
        List<Specification<Sale>> specs = Stream.of(
                        SaleSpecifications.hasType(type),
                        SaleSpecifications.hasCustomer(customerId),
                        SaleSpecifications.hasPaymentStatus(status),
                        SaleSpecifications.hasPaymentMethod(method),
                        SaleSpecifications.saleDateFrom(from),
                        SaleSpecifications.saleDateTo(to))
                .filter(Objects::nonNull)
                .toList();
        Specification<Sale> spec = specs.isEmpty() ? null : Specification.allOf(specs);
        return saleRepository.findAll(spec, pageable).map(SaleResponse::from);
    }

    @Transactional(readOnly = true)
    public SaleResponse findResponseById(Long id) {
        return SaleResponse.from(findById(id));
    }

    @Transactional(readOnly = true)
    public Sale findById(Long id) {
        return saleRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Venta", id));
    }

    @Transactional
    public SaleResponse create(SaleRequest request, SecurityUser currentUser) {
        SaleType type = request.type();
        if (type == SaleType.VENTA) {
            if (request.paymentMethod() == null) {
                throw new BusinessRuleException("El método de pago es obligatorio para una venta directa");
            }
            if (request.deliveryMethod() == null) {
                throw new BusinessRuleException("El método de entrega es obligatorio para una venta directa");
            }
        } else {
            if (request.customerId() == null) {
                throw new BusinessRuleException("El cliente es obligatorio para una separación");
            }
            if (request.limitDate() == null) {
                throw new BusinessRuleException("La fecha límite es obligatoria para una separación");
            }
            if (!request.limitDate().isAfter(request.saleDate())) {
                throw new BusinessRuleException("La fecha límite debe ser posterior a la fecha de separación");
            }
        }

        Customer customer = request.customerId() != null
                ? customerRepository.findById(request.customerId())
                        .orElseThrow(() -> ResourceNotFoundException.of("Cliente", request.customerId()))
                : null;

        Sale sale = new Sale();
        sale.setType(type);
        sale.setCustomer(customer);
        sale.setSaleDate(request.saleDate());
        sale.setPaymentMethod(type == SaleType.VENTA ? request.paymentMethod() : null);
        sale.setPaymentStatus(type == SaleType.VENTA ? request.paymentStatus() : PaymentStatus.PENDING);
        sale.setDeliveryMethod(type == SaleType.VENTA ? request.deliveryMethod() : null);
        sale.setLimitDate(type == SaleType.SEPARACION ? request.limitDate() : null);
        sale.setNotes(request.notes());

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal total = BigDecimal.ZERO;
        BigDecimal totalCost = BigDecimal.ZERO;

        for (SaleItemRequest itemRequest : request.items()) {
            Product product = productRepository.findById(itemRequest.productId())
                    .orElseThrow(() -> ResourceNotFoundException.of("Producto", itemRequest.productId()));
            if (product.getCurrentStock() < itemRequest.quantity()) {
                throw new BusinessRuleException(
                        "Stock insuficiente para '%s': disponible %d, solicitado %d"
                                .formatted(product.getName(), product.getCurrentStock(), itemRequest.quantity()));
            }

            BigDecimal lineGross = itemRequest.unitPrice().multiply(BigDecimal.valueOf(itemRequest.quantity()));
            BigDecimal lineSubtotal = lineGross.subtract(itemRequest.discount()).setScale(2, RoundingMode.HALF_UP);
            if (lineSubtotal.compareTo(BigDecimal.ZERO) < 0) {
                throw new BusinessRuleException("El descuento no puede superar el importe de la línea de '" + product.getName() + "'");
            }
            BigDecimal lineCost = product.getTotalCost().multiply(BigDecimal.valueOf(itemRequest.quantity()))
                    .setScale(2, RoundingMode.HALF_UP);

            SaleDetail detail = new SaleDetail();
            detail.setSale(sale);
            detail.setProduct(product);
            detail.setQuantity(itemRequest.quantity());
            detail.setUnitPrice(itemRequest.unitPrice());
            detail.setDiscount(itemRequest.discount());
            detail.setUnitCost(product.getTotalCost());
            detail.setSubtotal(lineSubtotal);
            sale.getItems().add(detail);

            subtotal = subtotal.add(lineGross);
            total = total.add(lineSubtotal);
            totalCost = totalCost.add(lineCost);
        }

        BigDecimal profit = total.subtract(totalCost).setScale(2, RoundingMode.HALF_UP);
        sale.setSubtotal(subtotal.setScale(2, RoundingMode.HALF_UP));
        sale.setTotal(total.setScale(2, RoundingMode.HALF_UP));
        sale.setTotalCost(totalCost);
        sale.setProfit(profit);
        sale.setPointsGenerated(type == SaleType.VENTA ? calculatePoints(customer, sale.getTotal()) : 0);

        Sale saved = saleRepository.save(sale);

        MovementType movementType = type == SaleType.VENTA ? MovementType.VENTA : MovementType.SEPARACION;
        for (SaleDetail detail : saved.getItems()) {
            inventoryService.registerMovement(
                    new InventoryMovementRequest(detail.getProduct().getId(), movementType, detail.getQuantity(),
                            createReason(saved, customer), null),
                    currentUser);
        }

        if (type == SaleType.VENTA) {
            loyaltyService.registerSaleEarnedPoints(saved, currentUser);
        }

        auditService.log(AuditAction.CREATE, moduleFor(saved), entityNameFor(saved), saved.getId().toString(), null, summarize(saved));
        return SaleResponse.from(saved);
    }

    private String createReason(Sale sale, Customer customer) {
        return sale.getType() == SaleType.VENTA
                ? "Venta #" + sale.getId()
                : "Separación #" + sale.getId() + (customer != null ? " para " + customer.getFullName() : "");
    }

    @Transactional
    public SaleResponse cancel(Long id, String reason, SecurityUser currentUser) {
        Sale sale = findById(id);
        if (sale.getPaymentStatus() == PaymentStatus.CANCELLED) {
            throw new BusinessRuleException(sale.getType() == SaleType.VENTA ? "La venta ya está cancelada" : "La separación ya está cancelada");
        }
        if (sale.getType() == SaleType.SEPARACION && sale.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BusinessRuleException("No se puede cancelar una separación ya pagada en su totalidad");
        }

        String cancelReasonText = (sale.getType() == SaleType.VENTA ? "Cancelación de venta #" : "Cancelación de separación #")
                + sale.getId() + ": " + reason;
        for (SaleDetail detail : sale.getItems()) {
            inventoryService.registerMovement(
                    new InventoryMovementRequest(detail.getProduct().getId(), MovementType.DEVOLUCION, detail.getQuantity(),
                            cancelReasonText, null),
                    currentUser);
        }

        if (sale.getType() == SaleType.VENTA) {
            loyaltyService.reverseSaleEarnedPoints(sale, currentUser);
        }

        String before = summarize(sale);
        sale.setPaymentStatus(PaymentStatus.CANCELLED);
        sale.setPointsGenerated(0);
        Sale saved = saleRepository.save(sale);

        auditService.log(AuditAction.UPDATE, moduleFor(saved), entityNameFor(saved), id.toString(), before, "CANCELLED: " + reason);
        return SaleResponse.from(saved);
    }

    /**
     * Corrige precio unitario/descuento de una o más líneas ya creadas (ej. un error de tipeo
     * al registrar la venta o la separación) — producto y cantidad quedan fijos, así que nunca
     * hace falta tocar stock/inventario. Recalcula subtotal/total/ganancia a partir de TODAS las
     * líneas, y reconcilia el ledger de puntos (siempre 0 para una SEPARACION, ver
     * {@link #rescalePoints}). Bloqueada en una venta/separación CANCELLED.
     *
     * <p>Los puntos nuevos se recalculan con la MISMA tasa efectiva original (puntos ÷ total al
     * momento de crearla), nunca con el {@code LOYALTY_POINTS_PER_SOL} actual — ver
     * {@link #rescalePoints}.</p>
     */
    @Transactional
    public SaleResponse updateItems(Long id, List<UpdateSaleItemsRequest.Item> items, SecurityUser currentUser) {
        Sale sale = findById(id);
        if (sale.getPaymentStatus() == PaymentStatus.CANCELLED) {
            throw new BusinessRuleException("No se puede editar una venta/separación cancelada");
        }
        String before = summarize(sale);
        BigDecimal originalTotal = sale.getTotal();
        int originalPoints = sale.getPointsGenerated();

        Map<Long, SaleDetail> detailsById = sale.getItems().stream()
                .collect(Collectors.toMap(SaleDetail::getId, detail -> detail));
        for (UpdateSaleItemsRequest.Item item : items) {
            SaleDetail detail = detailsById.get(item.detailId());
            if (detail == null) {
                throw new BusinessRuleException("La línea indicada no pertenece a esta venta");
            }
            BigDecimal lineGross = item.unitPrice().multiply(BigDecimal.valueOf(detail.getQuantity()));
            BigDecimal lineSubtotal = lineGross.subtract(item.discount()).setScale(2, RoundingMode.HALF_UP);
            if (lineSubtotal.compareTo(BigDecimal.ZERO) < 0) {
                throw new BusinessRuleException(
                        "El descuento no puede superar el importe de la línea de '" + detail.getProduct().getName() + "'");
            }
            detail.setUnitPrice(item.unitPrice());
            detail.setDiscount(item.discount());
            detail.setSubtotal(lineSubtotal);
        }

        recalculateTotals(sale);

        if (sale.getType() == SaleType.VENTA) {
            loyaltyService.reverseSaleEarnedPoints(sale, currentUser);
            sale.setPointsGenerated(rescalePoints(originalPoints, originalTotal, sale.getTotal()));
        }

        Sale saved = saleRepository.save(sale);
        if (sale.getType() == SaleType.VENTA) {
            loyaltyService.registerSaleEarnedPoints(saved, currentUser);
        }

        auditService.log(AuditAction.UPDATE, moduleFor(saved), entityNameFor(saved), id.toString(), before, summarize(saved));
        return SaleResponse.from(saved);
    }

    /**
     * Agrega un producto NUEVO a una venta/separación ya creada — a diferencia de
     * {@link #updateItems} (solo corrige precio/descuento de líneas existentes, nunca toca
     * stock), esto SÍ valida y descuenta inventario para la cantidad agregada, exactamente
     * igual que {@link #create}.
     */
    @Transactional
    public SaleResponse addItem(Long id, AddSaleItemRequest request, SecurityUser currentUser) {
        Sale sale = findById(id);
        if (sale.getPaymentStatus() == PaymentStatus.CANCELLED) {
            throw new BusinessRuleException("No se puede editar una venta/separación cancelada");
        }
        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> ResourceNotFoundException.of("Producto", request.productId()));
        if (product.getCurrentStock() < request.quantity()) {
            throw new BusinessRuleException(
                    "Stock insuficiente para '%s': disponible %d, solicitado %d"
                            .formatted(product.getName(), product.getCurrentStock(), request.quantity()));
        }

        BigDecimal lineGross = request.unitPrice().multiply(BigDecimal.valueOf(request.quantity()));
        BigDecimal lineSubtotal = lineGross.subtract(request.discount()).setScale(2, RoundingMode.HALF_UP);
        if (lineSubtotal.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessRuleException("El descuento no puede superar el importe de la línea de '" + product.getName() + "'");
        }

        String before = summarize(sale);
        BigDecimal originalTotal = sale.getTotal();
        int originalPoints = sale.getPointsGenerated();

        SaleDetail detail = new SaleDetail();
        detail.setSale(sale);
        detail.setProduct(product);
        detail.setQuantity(request.quantity());
        detail.setUnitPrice(request.unitPrice());
        detail.setDiscount(request.discount());
        detail.setUnitCost(product.getTotalCost());
        detail.setSubtotal(lineSubtotal);
        sale.getItems().add(detail);

        recalculateTotals(sale);

        if (sale.getType() == SaleType.VENTA) {
            loyaltyService.reverseSaleEarnedPoints(sale, currentUser);
            sale.setPointsGenerated(rescalePoints(originalPoints, originalTotal, sale.getTotal()));
        }

        Sale saved = saleRepository.save(sale);
        if (sale.getType() == SaleType.VENTA) {
            loyaltyService.registerSaleEarnedPoints(saved, currentUser);
        }

        MovementType movementType = sale.getType() == SaleType.VENTA ? MovementType.VENTA : MovementType.SEPARACION;
        String reason = (sale.getType() == SaleType.VENTA ? "Producto agregado a venta #" : "Producto agregado a separación #") + saved.getId();
        inventoryService.registerMovement(
                new InventoryMovementRequest(product.getId(), movementType, request.quantity(), reason, null),
                currentUser);

        auditService.log(AuditAction.UPDATE, moduleFor(saved), entityNameFor(saved), id.toString(), before, summarize(saved));
        return SaleResponse.from(saved);
    }

    private void recalculateTotals(Sale sale) {
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal total = BigDecimal.ZERO;
        BigDecimal totalCost = BigDecimal.ZERO;
        for (SaleDetail detail : sale.getItems()) {
            subtotal = subtotal.add(detail.getUnitPrice().multiply(BigDecimal.valueOf(detail.getQuantity())));
            total = total.add(detail.getSubtotal());
            totalCost = totalCost.add(
                    detail.getUnitCost().multiply(BigDecimal.valueOf(detail.getQuantity())).setScale(2, RoundingMode.HALF_UP));
        }
        sale.setSubtotal(subtotal.setScale(2, RoundingMode.HALF_UP));
        sale.setTotal(total.setScale(2, RoundingMode.HALF_UP));
        sale.setTotalCost(totalCost);
        sale.setProfit(sale.getTotal().subtract(totalCost).setScale(2, RoundingMode.HALF_UP));
    }

    /**
     * newTotal × (originalPoints ÷ originalTotal), redondeado hacia abajo — preserva la tasa
     * puntos/sol vigente cuando se creó la venta, nunca el {@code LOYALTY_POINTS_PER_SOL} de
     * hoy. Para una SEPARACION, {@code originalPoints} siempre es 0 (nunca generó puntos), así
     * que esta función devuelve 0 sin ambigüedad — no hace falta un guard aparte.
     */
    private int rescalePoints(int originalPoints, BigDecimal originalTotal, BigDecimal newTotal) {
        if (originalPoints <= 0 || originalTotal == null || originalTotal.signum() <= 0) {
            return 0;
        }
        return newTotal.multiply(BigDecimal.valueOf(originalPoints))
                .divide(originalTotal, 0, RoundingMode.DOWN)
                .intValue();
    }

    /**
     * Transición manual de estado de pago — solo para {@code type=VENTA} (el estado de una
     * SEPARACION se deriva SIEMPRE del ledger de abonos, ver {@link #registerPayment}/
     * {@link #updatePayment}/{@link #deletePayment}, nunca se setea a mano). CANCELLED queda
     * excluido a propósito: esa transición solo pasa por {@link #cancel}.
     */
    @Transactional
    public SaleResponse updatePaymentStatus(Long id, PaymentStatus newStatus) {
        Sale sale = findById(id);
        if (sale.getType() == SaleType.SEPARACION) {
            throw new BusinessRuleException(
                    "El estado de una separación se calcula desde sus abonos — usa el registro de abonos, no este endpoint");
        }
        if (sale.getPaymentStatus() == PaymentStatus.CANCELLED) {
            throw new BusinessRuleException("No se puede cambiar el estado de pago de una venta cancelada");
        }
        if (newStatus == PaymentStatus.CANCELLED) {
            throw new BusinessRuleException("Para cancelar una venta usa la opción 'Cancelar venta' (revierte stock y puntos)");
        }

        PaymentStatus before = sale.getPaymentStatus();
        sale.setPaymentStatus(newStatus);
        Sale saved = saleRepository.save(sale);

        auditService.log(AuditAction.UPDATE, "SALES", "Sale", id.toString(), before.toString(), newStatus.toString());
        return SaleResponse.from(saved);
    }

    // ---- Ledger de abonos (solo aplica a type=SEPARACION) ----

    @Transactional(readOnly = true)
    public List<PaymentResponse> listPayments(Long saleId) {
        findById(saleId);
        return paymentRepository.findBySaleIdOrderByCreatedAtDesc(saleId).stream().map(PaymentResponse::from).toList();
    }

    @Transactional
    public PaymentResponse registerPayment(Long saleId, PaymentRequest request, SecurityUser currentUser) {
        Sale sale = findById(saleId);
        requireSeparation(sale);
        if (sale.getPaymentStatus() == PaymentStatus.CANCELLED) {
            throw new BusinessRuleException("No se pueden registrar abonos en una separación cancelada");
        }
        if (sale.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BusinessRuleException("Esta separación ya está pagada en su totalidad");
        }

        BigDecimal alreadyPaid = paymentRepository.sumPaidAmount(saleId);
        BigDecimal balanceDue = sale.getTotal().subtract(alreadyPaid);
        if (request.amount().compareTo(balanceDue) > 0) {
            throw new BusinessRuleException(
                    "El abono (%s) supera el saldo pendiente (%s)".formatted(request.amount(), balanceDue));
        }

        Payment payment = new Payment();
        payment.setSale(sale);
        payment.setAmount(request.amount());
        payment.setPaymentMethod(request.paymentMethod());
        payment.setPaymentDate(request.paymentDate());
        payment.setNotes(request.notes());
        payment.setUserId(currentUser.getId());
        payment.setUsername(currentUser.getUsername());
        Payment savedPayment = paymentRepository.save(payment);

        BigDecimal newTotalPaid = alreadyPaid.add(request.amount());
        sale.setPaymentStatus(newTotalPaid.compareTo(sale.getTotal()) >= 0 ? PaymentStatus.PAID : PaymentStatus.PARTIAL);
        saleRepository.save(sale);

        auditService.log(AuditAction.CREATE, "SEPARATIONS", "Payment", savedPayment.getId().toString(), null,
                "venta=%d, monto=%s, saldoRestante=%s".formatted(saleId, request.amount(),
                        sale.getTotal().subtract(newTotalPaid)));

        return PaymentResponse.from(savedPayment);
    }

    /**
     * Corrige un abono ya registrado (monto/método/fecha/notas) — a diferencia de un ledger
     * 100% inmutable (InventoryMovement/AuditLog), acá se permite corregir un error de tipeo
     * del admin. El estado se recalcula siempre desde la suma real de abonos después del
     * cambio, nunca queda desincronizado.
     */
    @Transactional
    public PaymentResponse updatePayment(Long saleId, Long paymentId, PaymentRequest request, SecurityUser currentUser) {
        Sale sale = findById(saleId);
        requireSeparation(sale);
        if (sale.getPaymentStatus() == PaymentStatus.CANCELLED) {
            throw new BusinessRuleException("No se pueden modificar abonos de una separación cancelada");
        }
        Payment payment = findPayment(saleId, paymentId);

        BigDecimal othersTotal = paymentRepository.sumPaidAmount(saleId).subtract(payment.getAmount());
        BigDecimal newTotal = othersTotal.add(request.amount());
        if (newTotal.compareTo(sale.getTotal()) > 0) {
            throw new BusinessRuleException(
                    "El abono (%s) supera el saldo pendiente (%s)"
                            .formatted(request.amount(), sale.getTotal().subtract(othersTotal)));
        }

        String before = summarizePayment(payment);
        payment.setAmount(request.amount());
        payment.setPaymentMethod(request.paymentMethod());
        payment.setPaymentDate(request.paymentDate());
        payment.setNotes(request.notes());
        Payment saved = paymentRepository.save(payment);

        recalculateSeparationStatus(sale, newTotal);

        auditService.log(AuditAction.UPDATE, "SEPARATIONS", "Payment", paymentId.toString(), before, summarizePayment(saved));
        return PaymentResponse.from(saved);
    }

    /** Al eliminar un abono, el estado se recalcula desde la nueva suma (puede bajar de PAID/PARTIAL a PARTIAL/PENDING). */
    @Transactional
    public void deletePayment(Long saleId, Long paymentId, SecurityUser currentUser) {
        Sale sale = findById(saleId);
        requireSeparation(sale);
        if (sale.getPaymentStatus() == PaymentStatus.CANCELLED) {
            throw new BusinessRuleException("No se pueden eliminar abonos de una separación cancelada");
        }
        Payment payment = findPayment(saleId, paymentId);
        String before = summarizePayment(payment);
        paymentRepository.delete(payment);

        recalculateSeparationStatus(sale, paymentRepository.sumPaidAmount(saleId));

        auditService.log(AuditAction.DELETE, "SEPARATIONS", "Payment", paymentId.toString(), before, null);
    }

    private Payment findPayment(Long saleId, Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> ResourceNotFoundException.of("Abono", paymentId));
        if (!payment.getSale().getId().equals(saleId)) {
            throw new ResourceNotFoundException("Abono no encontrado en esta venta");
        }
        return payment;
    }

    private void recalculateSeparationStatus(Sale sale, BigDecimal totalPaid) {
        PaymentStatus newStatus;
        if (totalPaid.compareTo(BigDecimal.ZERO) <= 0) {
            newStatus = PaymentStatus.PENDING;
        } else if (totalPaid.compareTo(sale.getTotal()) >= 0) {
            newStatus = PaymentStatus.PAID;
        } else {
            newStatus = PaymentStatus.PARTIAL;
        }
        sale.setPaymentStatus(newStatus);
        saleRepository.save(sale);
    }

    private void requireSeparation(Sale sale) {
        if (sale.getType() != SaleType.SEPARACION) {
            throw new BusinessRuleException("Esta operación de abonos es solo para separaciones");
        }
    }

    private String summarizePayment(Payment p) {
        return "monto=%s, metodo=%s, fecha=%s".formatted(p.getAmount(), p.getPaymentMethod(), p.getPaymentDate());
    }

    private int calculatePoints(Customer customer, BigDecimal total) {
        if (customer == null) {
            return 0;
        }
        BigDecimal pointsPerSol = settingService.getNumber("LOYALTY_POINTS_PER_SOL");
        return total.multiply(pointsPerSol).setScale(0, RoundingMode.DOWN).intValue();
    }

    private String moduleFor(Sale sale) {
        return sale.getType() == SaleType.VENTA ? "SALES" : "SEPARATIONS";
    }

    private String entityNameFor(Sale sale) {
        return sale.getType() == SaleType.VENTA ? "Sale" : "Separation";
    }

    private String summarize(Sale sale) {
        BigDecimal paid = sale.getPayments().stream().map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        return "tipo=%s, total=%s, costo=%s, ganancia=%s, pagado=%s, estado=%s, items=%d"
                .formatted(sale.getType(), sale.getTotal(), sale.getTotalCost(), sale.getProfit(), paid,
                        sale.getPaymentStatus(), sale.getItems().size());
    }
}

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
import com.ramichanstore.backend.modules.sales.dto.SaleItemRequest;
import com.ramichanstore.backend.modules.sales.dto.SaleRequest;
import com.ramichanstore.backend.modules.sales.dto.SaleResponse;
import com.ramichanstore.backend.modules.sales.dto.UpdateSaleItemsRequest;
import com.ramichanstore.backend.modules.sales.entity.PaymentMethod;
import com.ramichanstore.backend.modules.sales.entity.PaymentStatus;
import com.ramichanstore.backend.modules.sales.entity.Sale;
import com.ramichanstore.backend.modules.sales.entity.SaleDetail;
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
 * Total, costo, ganancia y puntos generados SIEMPRE se calculan aquí, nunca se
 * aceptan editados desde el frontend. El descuento de stock pasa por
 * {@link InventoryService#registerMovement} (tipo VENTA) para que quede en el
 * kardex — nunca se toca {@code product.currentStock} directamente.
 */
@Service
@RequiredArgsConstructor
public class SaleService {

    private static final String MODULE = "SALES";

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final InventoryService inventoryService;
    private final SettingService settingService;
    private final LoyaltyService loyaltyService;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<SaleResponse> search(Long customerId, PaymentStatus status, PaymentMethod method,
            LocalDate from, LocalDate to, Pageable pageable) {
        List<Specification<Sale>> specs = Stream.of(
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
        Customer customer = request.customerId() != null
                ? customerRepository.findById(request.customerId())
                        .orElseThrow(() -> ResourceNotFoundException.of("Cliente", request.customerId()))
                : null;

        Sale sale = new Sale();
        sale.setCustomer(customer);
        sale.setSaleDate(request.saleDate());
        sale.setPaymentMethod(request.paymentMethod());
        sale.setPaymentStatus(request.paymentStatus());
        sale.setDeliveryMethod(request.deliveryMethod());
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
        sale.setPointsGenerated(calculatePoints(customer, total));

        Sale saved = saleRepository.save(sale);

        for (SaleDetail detail : saved.getItems()) {
            inventoryService.registerMovement(
                    new InventoryMovementRequest(detail.getProduct().getId(), MovementType.VENTA, detail.getQuantity(),
                            "Venta #" + saved.getId(), null),
                    currentUser);
        }

        loyaltyService.registerSaleEarnedPoints(saved, currentUser);

        auditService.log(AuditAction.CREATE, MODULE, "Sale", saved.getId().toString(), null, summarize(saved));
        return SaleResponse.from(saved);
    }

    @Transactional
    public SaleResponse cancel(Long id, String reason, SecurityUser currentUser) {
        Sale sale = findById(id);
        if (sale.getPaymentStatus() == PaymentStatus.CANCELLED) {
            throw new BusinessRuleException("La venta ya está cancelada");
        }

        for (SaleDetail detail : sale.getItems()) {
            inventoryService.registerMovement(
                    new InventoryMovementRequest(detail.getProduct().getId(), MovementType.DEVOLUCION, detail.getQuantity(),
                            "Cancelación de venta #" + sale.getId() + ": " + reason, null),
                    currentUser);
        }

        loyaltyService.reverseSaleEarnedPoints(sale, currentUser);

        String before = summarize(sale);
        sale.setPaymentStatus(PaymentStatus.CANCELLED);
        sale.setPointsGenerated(0);
        Sale saved = saleRepository.save(sale);

        auditService.log(AuditAction.UPDATE, MODULE, "Sale", id.toString(), before, "CANCELLED: " + reason);
        return SaleResponse.from(saved);
    }

    /**
     * Corrige precio unitario/descuento de una o más líneas ya creadas (ej. un error de tipeo
     * al registrar la venta) — producto y cantidad quedan fijos, así que nunca hace falta tocar
     * stock/inventario. Recalcula subtotal/total/ganancia de la venta completa a partir de TODAS
     * sus líneas (no solo las corregidas), y reconcilia el ledger de puntos: revierte los puntos
     * viejos y genera los nuevos — mismos métodos de {@link LoyaltyService} que ya usan
     * {@link #create} y {@link #cancel}, sin duplicar lógica. Bloqueada en una venta CANCELLED,
     * igual que {@link #updatePaymentStatus}.
     *
     * <p><b>Los puntos nuevos se recalculan con la MISMA tasa efectiva de la venta original
     * (puntos ÷ total al momento de crearla), nunca con el {@code LOYALTY_POINTS_PER_SOL}
     * actual</b> (ver {@link #rescalePoints}) — si se usara el setting vigente, cambiarlo más
     * adelante por cualquier motivo ajeno haría que corregir el precio de una venta vieja
     * aplicara retroactivamente una tasa que nunca estuvo vigente cuando el cliente compró.</p>
     */
    @Transactional
    public SaleResponse updateItems(Long id, List<UpdateSaleItemsRequest.Item> items, SecurityUser currentUser) {
        Sale sale = findById(id);
        if (sale.getPaymentStatus() == PaymentStatus.CANCELLED) {
            throw new BusinessRuleException("No se puede editar una venta cancelada");
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

        loyaltyService.reverseSaleEarnedPoints(sale, currentUser);
        sale.setPointsGenerated(rescalePoints(originalPoints, originalTotal, sale.getTotal()));

        Sale saved = saleRepository.save(sale);
        loyaltyService.registerSaleEarnedPoints(saved, currentUser);

        auditService.log(AuditAction.UPDATE, MODULE, "Sale", id.toString(), before, summarize(saved));
        return SaleResponse.from(saved);
    }

    /**
     * newTotal × (originalPoints ÷ originalTotal), redondeado hacia abajo — preserva la tasa
     * puntos/sol que estuvo vigente cuando se creó la venta, en vez de recalcular con
     * LOYALTY_POINTS_PER_SOL vigente HOY (ver Javadoc de {@link #updateItems}).
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
     * Transición manual de estado de pago para una venta ya creada (ej. de PENDING a PAID cuando
     * el cliente confirma el Yape/transferencia) — la única forma de cambiarlo hasta ahora era
     * al crearla, sin poder corregirlo después. CANCELLED queda excluido a propósito: esa
     * transición solo pasa por {@link #cancel}, que además revierte stock y puntos; una venta ya
     * cancelada tampoco se puede "reactivar" por acá.
     */
    @Transactional
    public SaleResponse updatePaymentStatus(Long id, PaymentStatus newStatus) {
        Sale sale = findById(id);
        if (sale.getPaymentStatus() == PaymentStatus.CANCELLED) {
            throw new BusinessRuleException("No se puede cambiar el estado de pago de una venta cancelada");
        }
        if (newStatus == PaymentStatus.CANCELLED) {
            throw new BusinessRuleException("Para cancelar una venta usa la opción 'Cancelar venta' (revierte stock y puntos)");
        }

        PaymentStatus before = sale.getPaymentStatus();
        sale.setPaymentStatus(newStatus);
        Sale saved = saleRepository.save(sale);

        auditService.log(AuditAction.UPDATE, MODULE, "Sale", id.toString(), before.toString(), newStatus.toString());
        return SaleResponse.from(saved);
    }

    private int calculatePoints(Customer customer, BigDecimal total) {
        if (customer == null) {
            return 0;
        }
        BigDecimal pointsPerSol = settingService.getNumber("LOYALTY_POINTS_PER_SOL");
        return total.multiply(pointsPerSol).setScale(0, RoundingMode.DOWN).intValue();
    }

    private String summarize(Sale sale) {
        return "total=%s, costo=%s, ganancia=%s, estado=%s, items=%d"
                .formatted(sale.getTotal(), sale.getTotalCost(), sale.getProfit(), sale.getPaymentStatus(), sale.getItems().size());
    }
}

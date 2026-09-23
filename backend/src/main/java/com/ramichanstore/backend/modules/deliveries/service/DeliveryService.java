package com.ramichanstore.backend.modules.deliveries.service;

import com.ramichanstore.backend.audit.AuditAction;
import com.ramichanstore.backend.audit.AuditService;
import com.ramichanstore.backend.common.exception.BusinessRuleException;
import com.ramichanstore.backend.common.exception.ResourceNotFoundException;
import com.ramichanstore.backend.modules.customers.entity.Customer;
import com.ramichanstore.backend.modules.customers.repository.CustomerRepository;
import com.ramichanstore.backend.modules.deliveries.dto.DeliveryRequest;
import com.ramichanstore.backend.modules.deliveries.dto.DeliveryResponse;
import com.ramichanstore.backend.modules.deliveries.dto.PendingPurchaseResponse;
import com.ramichanstore.backend.modules.deliveries.entity.Delivery;
import com.ramichanstore.backend.modules.deliveries.entity.DeliveryItem;
import com.ramichanstore.backend.modules.deliveries.entity.DeliveryStatus;
import com.ramichanstore.backend.modules.deliveries.repository.DeliveryItemRepository;
import com.ramichanstore.backend.modules.deliveries.repository.DeliveryRepository;
import com.ramichanstore.backend.modules.deliveries.repository.DeliverySpecifications;
import com.ramichanstore.backend.modules.sales.entity.Sale;
import com.ramichanstore.backend.modules.sales.repository.SaleRepository;
import com.ramichanstore.backend.modules.separations.entity.Separation;
import com.ramichanstore.backend.modules.separations.repository.SeparationRepository;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Una entrega es el seguimiento logístico de UN CLIENTE (Fase 17), no de una
 * sola venta: agrupa varias compras (ventas y/o separaciones) de ese cliente
 * en un solo seguimiento. Antes de Fase 17 era 1:1 con una Sale — ver
 * migración V16 y CLAUDE.md.
 */
@Service
@RequiredArgsConstructor
public class DeliveryService {

    private static final String MODULE = "DELIVERIES";

    private final DeliveryRepository deliveryRepository;
    private final DeliveryItemRepository deliveryItemRepository;
    private final CustomerRepository customerRepository;
    private final SaleRepository saleRepository;
    private final SeparationRepository separationRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<DeliveryResponse> search(Long customerId, DeliveryStatus status, Pageable pageable) {
        List<Specification<Delivery>> specs = Stream.of(
                        DeliverySpecifications.hasCustomer(customerId),
                        DeliverySpecifications.hasStatus(status))
                .filter(Objects::nonNull)
                .toList();
        Specification<Delivery> spec = specs.isEmpty() ? null : Specification.allOf(specs);
        return deliveryRepository.findAll(spec, pageable).map(DeliveryResponse::from);
    }

    @Transactional(readOnly = true)
    public DeliveryResponse findResponseById(Long id) {
        return DeliveryResponse.from(findById(id));
    }

    @Transactional(readOnly = true)
    public Delivery findById(Long id) {
        return deliveryRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Entrega", id));
    }

    /**
     * Compras del cliente que aún no están en ninguna entrega — o que ya están
     * en {@code excludeDeliveryId} (para poder editar esa entrega sin que sus
     * propias compras actuales desaparezcan de la lista de candidatas).
     */
    @Transactional(readOnly = true)
    public List<PendingPurchaseResponse> findPendingPurchases(Long customerId, Long excludeDeliveryId) {
        Set<Long> bundledSaleIds = new LinkedHashSet<>(deliveryItemRepository.findBundledSaleIds(excludeDeliveryId));
        Set<Long> bundledSeparationIds = new LinkedHashSet<>(deliveryItemRepository.findBundledSeparationIds(excludeDeliveryId));

        List<PendingPurchaseResponse> result = new ArrayList<>();
        for (Sale sale : saleRepository.findByCustomerIdOrderBySaleDateDesc(customerId)) {
            if (!bundledSaleIds.contains(sale.getId())) {
                result.add(PendingPurchaseResponse.fromSale(sale));
            }
        }
        for (Separation separation : separationRepository.findByCustomerIdOrderBySeparationDateDesc(customerId)) {
            if (!bundledSeparationIds.contains(separation.getId())) {
                result.add(PendingPurchaseResponse.fromSeparation(separation));
            }
        }
        result.sort((a, b) -> b.purchaseDate().compareTo(a.purchaseDate()));
        return result;
    }

    @Transactional
    public DeliveryResponse create(DeliveryRequest request) {
        Customer customer = customerRepository.findById(request.customerId())
                .orElseThrow(() -> ResourceNotFoundException.of("Cliente", request.customerId()));

        Delivery delivery = new Delivery();
        delivery.setCustomer(customer);
        applyRequest(delivery, request, null);
        Delivery saved = deliveryRepository.save(delivery);
        auditService.log(AuditAction.CREATE, MODULE, "Delivery", saved.getId().toString(), null, summarize(saved));
        return DeliveryResponse.from(saved);
    }

    @Transactional
    public DeliveryResponse update(Long id, DeliveryRequest request) {
        Delivery delivery = findById(id);
        String before = summarize(delivery);
        applyRequest(delivery, request, id);
        Delivery saved = deliveryRepository.save(delivery);
        auditService.log(AuditAction.UPDATE, MODULE, "Delivery", id.toString(), before, summarize(saved));
        return DeliveryResponse.from(saved);
    }

    /**
     * Reconcilia por diferencia (no clear()+re-add): con orphanRemoval activo,
     * borrar y re-insertar la misma fila en el mismo flush puede chocar
     * momentáneamente contra los índices únicos UQ_delivery_items_sale/
     * separation si Hibernate ordena el INSERT antes que el DELETE. Solo se
     * quitan los items que ya no correspondan y solo se agregan los nuevos.
     */
    private void applyRequest(Delivery delivery, DeliveryRequest request, Long deliveryId) {
        Set<Long> desiredSaleIds = new LinkedHashSet<>(request.saleIds() != null ? request.saleIds() : List.of());
        Set<Long> desiredSeparationIds = new LinkedHashSet<>(request.separationIds() != null ? request.separationIds() : List.of());
        if (desiredSaleIds.isEmpty() && desiredSeparationIds.isEmpty()) {
            throw new BusinessRuleException("La entrega debe incluir al menos una compra");
        }

        delivery.getItems().removeIf(item ->
                (item.getSale() != null && !desiredSaleIds.contains(item.getSale().getId()))
                        || (item.getSeparation() != null && !desiredSeparationIds.contains(item.getSeparation().getId())));

        Set<Long> existingSaleIds = delivery.getItems().stream()
                .filter(i -> i.getSale() != null).map(i -> i.getSale().getId()).collect(Collectors.toSet());
        Set<Long> existingSeparationIds = delivery.getItems().stream()
                .filter(i -> i.getSeparation() != null).map(i -> i.getSeparation().getId()).collect(Collectors.toSet());

        Set<Long> bundledSaleIds = new LinkedHashSet<>(deliveryItemRepository.findBundledSaleIds(deliveryId));
        Set<Long> bundledSeparationIds = new LinkedHashSet<>(deliveryItemRepository.findBundledSeparationIds(deliveryId));

        for (Long saleId : desiredSaleIds) {
            if (existingSaleIds.contains(saleId)) {
                continue;
            }
            if (bundledSaleIds.contains(saleId)) {
                throw new BusinessRuleException("La venta #" + saleId + " ya está incluida en otra entrega");
            }
            Sale sale = saleRepository.findById(saleId).orElseThrow(() -> ResourceNotFoundException.of("Venta", saleId));
            Long saleCustomerId = sale.getCustomer() != null ? sale.getCustomer().getId() : null;
            if (!delivery.getCustomer().getId().equals(saleCustomerId)) {
                throw new BusinessRuleException("La venta #" + saleId + " no pertenece a este cliente");
            }
            DeliveryItem item = new DeliveryItem();
            item.setDelivery(delivery);
            item.setSale(sale);
            delivery.getItems().add(item);
        }

        for (Long separationId : desiredSeparationIds) {
            if (existingSeparationIds.contains(separationId)) {
                continue;
            }
            if (bundledSeparationIds.contains(separationId)) {
                throw new BusinessRuleException("La separación #" + separationId + " ya está incluida en otra entrega");
            }
            Separation separation = separationRepository.findById(separationId)
                    .orElseThrow(() -> ResourceNotFoundException.of("Separación", separationId));
            if (!delivery.getCustomer().getId().equals(separation.getCustomer().getId())) {
                throw new BusinessRuleException("La separación #" + separationId + " no pertenece a este cliente");
            }
            DeliveryItem item = new DeliveryItem();
            item.setDelivery(delivery);
            item.setSeparation(separation);
            delivery.getItems().add(item);
        }

        delivery.setDeliveryType(request.deliveryType());
        delivery.setAddress(request.address());
        delivery.setDistrict(request.district());
        delivery.setDepartment(request.department());
        delivery.setProvince(request.province());
        delivery.setAgency(request.agency());
        delivery.setCourier(request.courier());
        delivery.setScheduledDate(request.scheduledDate());
        delivery.setStatus(request.status());
        delivery.setNotes(request.notes());
    }

    private String summarize(Delivery delivery) {
        return "cliente=%d, compras=%d, tipo=%s, estado=%s"
                .formatted(delivery.getCustomer().getId(), delivery.getItems().size(), delivery.getDeliveryType(), delivery.getStatus());
    }
}

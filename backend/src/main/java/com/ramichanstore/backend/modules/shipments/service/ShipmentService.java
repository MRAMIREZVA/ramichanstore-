package com.ramichanstore.backend.modules.shipments.service;

import com.ramichanstore.backend.audit.AuditAction;
import com.ramichanstore.backend.audit.AuditService;
import com.ramichanstore.backend.common.exception.BusinessRuleException;
import com.ramichanstore.backend.common.exception.ResourceNotFoundException;
import com.ramichanstore.backend.modules.shipments.dto.ShipmentItemRequest;
import com.ramichanstore.backend.modules.shipments.dto.ShipmentRequest;
import com.ramichanstore.backend.modules.shipments.dto.ShipmentResponse;
import com.ramichanstore.backend.modules.shipments.entity.Shipment;
import com.ramichanstore.backend.modules.shipments.entity.ShipmentHolder;
import com.ramichanstore.backend.modules.shipments.entity.ShipmentItem;
import com.ramichanstore.backend.modules.shipments.entity.ShipmentRecipient;
import com.ramichanstore.backend.modules.shipments.entity.ShipmentStatus;
import com.ramichanstore.backend.modules.shipments.entity.ShipmentType;
import com.ramichanstore.backend.modules.shipments.repository.ShipmentHolderRepository;
import com.ramichanstore.backend.modules.shipments.repository.ShipmentRecipientRepository;
import com.ramichanstore.backend.modules.shipments.repository.ShipmentRepository;
import com.ramichanstore.backend.modules.shipments.repository.ShipmentSpecifications;
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

@Service
@RequiredArgsConstructor
public class ShipmentService {

    private static final String MODULE = "SHIPMENTS";

    private final ShipmentRepository shipmentRepository;
    private final ShipmentHolderRepository shipmentHolderRepository;
    private final ShipmentRecipientRepository shipmentRecipientRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<ShipmentResponse> search(
            String term, ShipmentStatus status, ShipmentType type, Long holderId,
            LocalDate from, LocalDate to, Pageable pageable) {
        List<Specification<Shipment>> specs = Stream.of(
                        ShipmentSpecifications.search(term),
                        ShipmentSpecifications.hasStatus(status),
                        ShipmentSpecifications.hasShipmentType(type),
                        ShipmentSpecifications.hasHolder(holderId),
                        ShipmentSpecifications.departureFrom(from),
                        ShipmentSpecifications.departureTo(to))
                .filter(Objects::nonNull)
                .toList();
        Specification<Shipment> spec = specs.isEmpty() ? null : Specification.allOf(specs);
        return shipmentRepository.findAll(spec, pageable).map(ShipmentResponse::from);
    }

    @Transactional(readOnly = true)
    public ShipmentResponse findResponseById(Long id) {
        return ShipmentResponse.from(findById(id));
    }

    @Transactional(readOnly = true)
    public Shipment findById(Long id) {
        return shipmentRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Embarque", id));
    }

    @Transactional
    public ShipmentResponse create(ShipmentRequest request) {
        if (shipmentRepository.existsByCodeIgnoreCase(request.code())) {
            throw new BusinessRuleException("Ya existe un embarque con el código '" + request.code() + "'");
        }
        Shipment shipment = new Shipment();
        applyRequest(shipment, request);
        Shipment saved = shipmentRepository.save(shipment);
        auditService.log(AuditAction.CREATE, MODULE, "Shipment", saved.getId().toString(), null, summarize(saved));
        return ShipmentResponse.from(saved);
    }

    @Transactional
    public ShipmentResponse update(Long id, ShipmentRequest request) {
        Shipment shipment = findById(id);
        if (!shipment.getCode().equalsIgnoreCase(request.code()) && shipmentRepository.existsByCodeIgnoreCase(request.code())) {
            throw new BusinessRuleException("Ya existe un embarque con el código '" + request.code() + "'");
        }
        String before = summarize(shipment);
        applyRequest(shipment, request);
        Shipment saved = shipmentRepository.save(shipment);
        auditService.log(AuditAction.UPDATE, MODULE, "Shipment", id.toString(), before, summarize(saved));
        return ShipmentResponse.from(saved);
    }

    @Transactional
    public void delete(Long id) {
        Shipment shipment = findById(id);
        shipment.softDelete();
        shipmentRepository.save(shipment);
        auditService.log(AuditAction.DELETE, MODULE, "Shipment", id.toString(), summarize(shipment), null);
    }

    private void applyRequest(Shipment shipment, ShipmentRequest request) {
        shipment.setCode(request.code().trim());
        shipment.setHolder(resolveHolder(request.holderId()));
        shipment.setRecipient(resolveRecipient(request.recipientId()));
        shipment.setZenOrderNumber(request.zenOrderNumber());
        shipment.setProductCost(request.productCost());
        shipment.setShippingCost(request.shippingCost());
        shipment.setCommissionCost(request.commissionCost());
        shipment.setDomesticJapanShippingCost(request.domesticJapanShippingCost());
        shipment.setAdditionalCost(request.additionalCost());
        shipment.setTotalSoles(request.totalSoles());
        shipment.setTotalDollars(request.totalDollars());
        shipment.setHandlingCost(request.handlingCost());
        shipment.setFinalCost(request.finalCost());
        shipment.setShipmentType(request.shipmentType());
        shipment.setDepartureDate(request.departureDate());
        shipment.setArrivalDate(request.arrivalDate());
        shipment.setTravelDays(request.travelDays());
        shipment.setPossibleArrivalDate(request.possibleArrivalDate());
        shipment.setFiguresWeight(request.figuresWeight());
        shipment.setFinalWeight(request.finalWeight());
        shipment.setStatus(request.status());
        shipment.setNotes(request.notes());
        replaceItems(shipment, request.items());
    }

    /** Sin índice único en shipment_items — a diferencia de DeliveryItem, un reemplazo simple (clear + agregar) no choca con nada. */
    private void replaceItems(Shipment shipment, List<ShipmentItemRequest> requestedItems) {
        shipment.getItems().clear();
        for (ShipmentItemRequest itemRequest : requestedItems) {
            ShipmentItem item = new ShipmentItem();
            item.setShipment(shipment);
            item.setArticleCode(itemRequest.articleCode());
            item.setDescription(itemRequest.description());
            item.setQuantity(itemRequest.quantity());
            shipment.getItems().add(item);
        }
    }

    private ShipmentHolder resolveHolder(Long id) {
        return shipmentHolderRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Titular de cuenta ZEN", id));
    }

    private ShipmentRecipient resolveRecipient(Long id) {
        return shipmentRecipientRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Titular del embarque", id));
    }

    private String summarize(Shipment shipment) {
        return "codigo=%s, titular=%s, estado=%s".formatted(
                shipment.getCode(), shipment.getHolder().getName(), shipment.getStatus());
    }
}

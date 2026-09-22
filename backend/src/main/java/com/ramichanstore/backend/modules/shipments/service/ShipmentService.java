package com.ramichanstore.backend.modules.shipments.service;

import com.ramichanstore.backend.audit.AuditAction;
import com.ramichanstore.backend.audit.AuditService;
import com.ramichanstore.backend.common.exception.BusinessRuleException;
import com.ramichanstore.backend.common.exception.ResourceNotFoundException;
import com.ramichanstore.backend.modules.shipments.dto.ShipmentDocumentResponse;
import com.ramichanstore.backend.modules.shipments.dto.ShipmentItemRequest;
import com.ramichanstore.backend.modules.shipments.dto.ShipmentItemResponse;
import com.ramichanstore.backend.modules.shipments.dto.ShipmentRequest;
import com.ramichanstore.backend.modules.shipments.dto.ShipmentResponse;
import com.ramichanstore.backend.modules.shipments.entity.Shipment;
import com.ramichanstore.backend.modules.shipments.entity.ShipmentDocument;
import com.ramichanstore.backend.modules.shipments.entity.ShipmentDocumentType;
import com.ramichanstore.backend.modules.shipments.entity.ShipmentHolder;
import com.ramichanstore.backend.modules.shipments.entity.ShipmentItem;
import com.ramichanstore.backend.modules.shipments.entity.ShipmentRecipient;
import com.ramichanstore.backend.modules.shipments.entity.ShipmentStatus;
import com.ramichanstore.backend.modules.shipments.entity.ShipmentType;
import com.ramichanstore.backend.modules.shipments.repository.ShipmentDocumentRepository;
import com.ramichanstore.backend.modules.shipments.repository.ShipmentHolderRepository;
import com.ramichanstore.backend.modules.shipments.repository.ShipmentItemRepository;
import com.ramichanstore.backend.modules.shipments.repository.ShipmentRecipientRepository;
import com.ramichanstore.backend.modules.shipments.repository.ShipmentRepository;
import com.ramichanstore.backend.modules.shipments.repository.ShipmentSpecifications;
import com.ramichanstore.backend.security.SecurityUser;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
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
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class ShipmentService {

    private static final String MODULE = "SHIPMENTS";

    private static final long MAX_IMAGE_SIZE_BYTES = 5L * 1024 * 1024;
    private static final List<String> ALLOWED_CONTENT_TYPES =
            List.of("image/jpeg", "image/png", "image/webp", "image/gif");

    private static final long MAX_DOCUMENT_SIZE_BYTES = 10L * 1024 * 1024;
    private static final List<String> ALLOWED_DOCUMENT_CONTENT_TYPES =
            List.of("application/pdf", "image/jpeg", "image/png", "image/webp");

    private final ShipmentRepository shipmentRepository;
    private final ShipmentHolderRepository shipmentHolderRepository;
    private final ShipmentRecipientRepository shipmentRecipientRepository;
    private final ShipmentItemRepository shipmentItemRepository;
    private final ShipmentDocumentRepository shipmentDocumentRepository;
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
        shipment.setHandlingCost(request.handlingCost());
        shipment.setExchangeRate(request.exchangeRate());
        shipment.setShipmentType(request.shipmentType());
        shipment.setDepartureDate(request.departureDate());
        shipment.setArrivalDate(request.arrivalDate());
        shipment.setTravelDays(request.travelDays());
        shipment.setPossibleArrivalDate(request.possibleArrivalDate());
        shipment.setFiguresWeight(request.figuresWeight());
        shipment.setFinalWeight(request.finalWeight());
        shipment.setStatus(request.status());
        shipment.setNotes(request.notes());
        shipment.setWentThroughCustoms(request.wentThroughCustoms());
        shipment.setCustomsTaxAmount(request.customsTaxAmount());
        reconcileItems(shipment, request.items());
    }

    /**
     * Reconcilia por diferencia en vez de clear()+agregar: un artículo ya existente
     * (viene con id) se actualiza en el mismo row para no perder su imagen subida;
     * solo se borran los que ya no vienen en la lista y solo se crean los nuevos
     * (sin id). Mismo patrón que DeliveryService.applyRequest (ver CLAUDE.md, lección
     * de Fase 17) — necesario acá porque, a diferencia de antes, el id del artículo
     * ahora sí importa (image upload/delete apunta a un itemId estable).
     */
    private void reconcileItems(Shipment shipment, List<ShipmentItemRequest> requestedItems) {
        Map<Long, ShipmentItem> existingById = shipment.getItems().stream()
                .filter(i -> i.getId() != null)
                .collect(Collectors.toMap(ShipmentItem::getId, i -> i));
        Set<Long> keepIds = requestedItems.stream()
                .map(ShipmentItemRequest::id)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        shipment.getItems().removeIf(i -> i.getId() != null && !keepIds.contains(i.getId()));

        for (ShipmentItemRequest itemRequest : requestedItems) {
            ShipmentItem item = itemRequest.id() != null ? existingById.get(itemRequest.id()) : null;
            if (item == null) {
                item = new ShipmentItem();
                item.setShipment(shipment);
                shipment.getItems().add(item);
            }
            item.setArticleCode(itemRequest.articleCode());
            item.setDescription(itemRequest.description());
            item.setQuantity(itemRequest.quantity());
        }
    }

    @Transactional
    public ShipmentItemResponse uploadItemImage(Long itemId, MultipartFile file) {
        ShipmentItem item = findItemById(itemId);

        if (file.isEmpty()) {
            throw new BusinessRuleException("El archivo está vacío");
        }
        if (file.getSize() > MAX_IMAGE_SIZE_BYTES) {
            throw new BusinessRuleException("La imagen no debe superar 5MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new BusinessRuleException("Formato de imagen no soportado (usa JPG, PNG, WEBP o GIF)");
        }

        item.setImageFileName(file.getOriginalFilename());
        item.setImageContentType(contentType);
        try {
            item.setImageData(file.getBytes());
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo leer el archivo de imagen", e);
        }
        ShipmentItem saved = shipmentItemRepository.save(item);
        auditService.log(AuditAction.UPDATE, MODULE, "ShipmentItem", itemId.toString(), null, "imagen subida");
        return ShipmentItemResponse.from(saved);
    }

    @Transactional
    public void deleteItemImage(Long itemId) {
        ShipmentItem item = findItemById(itemId);
        item.setImageData(null);
        item.setImageFileName(null);
        item.setImageContentType(null);
        shipmentItemRepository.save(item);
        auditService.log(AuditAction.UPDATE, MODULE, "ShipmentItem", itemId.toString(), null, "imagen eliminada");
    }

    @Transactional(readOnly = true)
    public ShipmentItem findItemForServing(Long itemId) {
        return findItemById(itemId);
    }

    private ShipmentItem findItemById(Long itemId) {
        return shipmentItemRepository.findById(itemId).orElseThrow(() -> ResourceNotFoundException.of("Artículo de embarque", itemId));
    }

    /**
     * Sube (o reemplaza, si ya existía uno del mismo tipo) un documento del embarque.
     * Un slot único por tipo (ver índice único en V25) — reemplazar es simplemente
     * actualizar la misma fila en vez de crear una nueva.
     */
    @Transactional
    public ShipmentDocumentResponse uploadDocument(
            Long shipmentId, ShipmentDocumentType type, MultipartFile file, SecurityUser currentUser) {
        Shipment shipment = findById(shipmentId);

        if (file.isEmpty()) {
            throw new BusinessRuleException("El archivo está vacío");
        }
        if (file.getSize() > MAX_DOCUMENT_SIZE_BYTES) {
            throw new BusinessRuleException("El documento no debe superar 10MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_DOCUMENT_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new BusinessRuleException("Formato de documento no soportado (usa PDF, JPG, PNG o WEBP)");
        }

        ShipmentDocument doc = shipmentDocumentRepository.findByShipmentIdAndDocumentType(shipmentId, type)
                .orElseGet(() -> {
                    ShipmentDocument created = new ShipmentDocument();
                    created.setShipment(shipment);
                    created.setDocumentType(type);
                    return created;
                });
        doc.setFileName(file.getOriginalFilename());
        doc.setContentType(contentType);
        try {
            doc.setFileData(file.getBytes());
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo leer el archivo del documento", e);
        }
        doc.setUploadedAt(LocalDateTime.now());
        doc.setUploadedBy(currentUser != null ? currentUser.getUsername() : null);
        ShipmentDocument saved = shipmentDocumentRepository.save(doc);
        auditService.log(AuditAction.UPDATE, MODULE, "ShipmentDocument", shipmentId + "/" + type, null, "documento subido");
        return ShipmentDocumentResponse.from(shipmentId, saved);
    }

    @Transactional
    public void deleteDocument(Long shipmentId, ShipmentDocumentType type) {
        ShipmentDocument doc = findDocument(shipmentId, type);
        shipmentDocumentRepository.delete(doc);
        auditService.log(AuditAction.UPDATE, MODULE, "ShipmentDocument", shipmentId + "/" + type, null, "documento eliminado");
    }

    @Transactional(readOnly = true)
    public ShipmentDocument findDocumentForServing(Long shipmentId, ShipmentDocumentType type) {
        return findDocument(shipmentId, type);
    }

    private ShipmentDocument findDocument(Long shipmentId, ShipmentDocumentType type) {
        return shipmentDocumentRepository.findByShipmentIdAndDocumentType(shipmentId, type)
                .orElseThrow(() -> ResourceNotFoundException.of("Documento de embarque", shipmentId));
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

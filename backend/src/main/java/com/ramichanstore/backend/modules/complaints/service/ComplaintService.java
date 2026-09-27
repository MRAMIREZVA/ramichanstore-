package com.ramichanstore.backend.modules.complaints.service;

import com.ramichanstore.backend.audit.AuditAction;
import com.ramichanstore.backend.audit.AuditService;
import com.ramichanstore.backend.common.exception.BusinessRuleException;
import com.ramichanstore.backend.common.exception.ResourceNotFoundException;
import com.ramichanstore.backend.modules.complaints.dto.ComplaintResponse;
import com.ramichanstore.backend.modules.complaints.dto.ComplaintSubmission;
import com.ramichanstore.backend.modules.complaints.dto.RespondComplaintRequest;
import com.ramichanstore.backend.modules.complaints.entity.Complaint;
import com.ramichanstore.backend.modules.complaints.entity.ComplaintStatus;
import com.ramichanstore.backend.modules.complaints.entity.ComplaintType;
import com.ramichanstore.backend.modules.complaints.repository.ComplaintRepository;
import com.ramichanstore.backend.modules.complaints.repository.ComplaintSpecifications;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
 * Libro de Reclamaciones Virtual (Fase 43) — {@code submit} es la única
 * operación que puede llamar un visitante anónimo del catálogo; el resto
 * (buscar/responder) son de administración. El folio es el correlativo legal
 * visible para el consumidor, generado con el mismo criterio de
 * "contar + reintentar en colisión" que {@code ProductService.generateSku()}.
 */
@Service
@RequiredArgsConstructor
public class ComplaintService {

    private static final String MODULE = "COMPLAINTS";

    private final ComplaintRepository complaintRepository;
    private final AuditService auditService;

    @Transactional
    public ComplaintResponse submit(ComplaintSubmission request) {
        if (request.isMinor() && !hasText(request.guardianFullName())) {
            throw new BusinessRuleException("Si el reclamante es menor de edad, el nombre del padre/madre/tutor es obligatorio");
        }

        Complaint complaint = new Complaint();
        complaint.setFolioNumber(generateFolioNumber());
        complaint.setType(request.type());
        complaint.setConsumerFullName(request.consumerFullName());
        complaint.setConsumerDocumentType(request.consumerDocumentType());
        complaint.setConsumerDocumentNumber(request.consumerDocumentNumber());
        complaint.setConsumerAddress(request.consumerAddress());
        complaint.setConsumerEmail(request.consumerEmail());
        complaint.setConsumerPhone(request.consumerPhone());
        complaint.setMinor(request.isMinor());
        complaint.setGuardianFullName(request.guardianFullName());
        complaint.setGuardianDocumentNumber(request.guardianDocumentNumber());
        complaint.setGoodDescription(request.goodDescription());
        complaint.setClaimedAmount(request.claimedAmount());
        complaint.setDetail(request.detail());
        complaint.setConsumerRequest(request.consumerRequest());
        complaint.setStatus(ComplaintStatus.PENDIENTE);

        Complaint saved = complaintRepository.save(complaint);
        auditService.log(AuditAction.CREATE, MODULE, "Complaint", saved.getId().toString(), null, summarize(saved));
        return ComplaintResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public Page<ComplaintResponse> search(ComplaintType type, ComplaintStatus status, LocalDate from, LocalDate to, Pageable pageable) {
        List<Specification<Complaint>> specs = Stream.of(
                        ComplaintSpecifications.hasType(type),
                        ComplaintSpecifications.hasStatus(status),
                        ComplaintSpecifications.createdFrom(from),
                        ComplaintSpecifications.createdTo(to))
                .filter(Objects::nonNull)
                .toList();
        return complaintRepository.findAll(Specification.allOf(specs), pageable).map(ComplaintResponse::from);
    }

    @Transactional(readOnly = true)
    public ComplaintResponse findResponseById(Long id) {
        return ComplaintResponse.from(findById(id));
    }

    @Transactional(readOnly = true)
    public Complaint findById(Long id) {
        return complaintRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Reclamo", id));
    }

    @Transactional
    public ComplaintResponse respond(Long id, RespondComplaintRequest request) {
        Complaint complaint = findById(id);
        if (request.status() == ComplaintStatus.PENDIENTE) {
            throw new BusinessRuleException("No se puede volver a dejar un reclamo respondido como \"Pendiente\"");
        }
        ComplaintStatus previousStatus = complaint.getStatus();
        complaint.setStatus(request.status());
        complaint.setProviderResponse(request.providerResponse());
        complaint.setRespondedAt(LocalDateTime.now());
        Complaint saved = complaintRepository.save(complaint);
        auditService.log(AuditAction.UPDATE, MODULE, "Complaint", id.toString(),
                previousStatus.toString(), request.status() + ": " + request.providerResponse());
        return ComplaintResponse.from(saved);
    }

    /**
     * "RQ-000001" — mismo criterio que ProductService.generateSku(): contar los existentes y
     * probar el siguiente número si hay colisión (huecos por soft-delete, alta concurrente).
     */
    private String generateFolioNumber() {
        long seq = complaintRepository.count() + 1;
        String candidate = "RQ-%06d".formatted(seq);
        while (complaintRepository.existsByFolioNumberIgnoreCase(candidate)) {
            seq++;
            candidate = "RQ-%06d".formatted(seq);
        }
        return candidate;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String summarize(Complaint complaint) {
        return "folio=%s, tipo=%s, consumidor=%s, doc=%s".formatted(
                complaint.getFolioNumber(), complaint.getType(), complaint.getConsumerFullName(), complaint.getConsumerDocumentNumber());
    }
}

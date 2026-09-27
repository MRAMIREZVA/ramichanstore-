package com.ramichanstore.backend.modules.complaints.entity;

import com.ramichanstore.backend.common.base.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;

/**
 * Libro de Reclamaciones Virtual (Fase 43) — obligatorio por ley para toda
 * tienda online en Perú. Enviado desde una página pública sin login (mismo
 * criterio que OrderRequest, Fase 18): puede extender BaseEntity aunque nazca
 * de un submit anónimo porque JpaAuditingConfig.auditorAware() ya cae a
 * "system" cuando no hay usuario autenticado. `submit()` es la única
 * operación que puede llamar un visitante — responder es de administración.
 */
@Entity
@Table(name = "complaints")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
public class Complaint extends BaseEntity {

    @Column(name = "folio_number", nullable = false, unique = true, length = 20)
    private String folioNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ComplaintType type;

    @Column(name = "consumer_full_name", nullable = false, length = 200)
    private String consumerFullName;

    @Column(name = "consumer_document_type", nullable = false, length = 20)
    private String consumerDocumentType;

    @Column(name = "consumer_document_number", nullable = false, length = 20)
    private String consumerDocumentNumber;

    @Column(name = "consumer_address", nullable = false, length = 255)
    private String consumerAddress;

    @Column(name = "consumer_email", nullable = false, length = 150)
    private String consumerEmail;

    @Column(name = "consumer_phone", nullable = false, length = 30)
    private String consumerPhone;

    @Column(name = "is_minor", nullable = false)
    private boolean minor;

    @Column(name = "guardian_full_name", length = 200)
    private String guardianFullName;

    @Column(name = "guardian_document_number", length = 20)
    private String guardianDocumentNumber;

    @Column(name = "good_description", nullable = false, length = 500)
    private String goodDescription;

    @Column(name = "claimed_amount", precision = 10, scale = 2)
    private BigDecimal claimedAmount;

    @Column(nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String detail;

    @Column(name = "consumer_request", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String consumerRequest;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ComplaintStatus status = ComplaintStatus.PENDIENTE;

    @Column(name = "provider_response", columnDefinition = "NVARCHAR(MAX)")
    private String providerResponse;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;
}

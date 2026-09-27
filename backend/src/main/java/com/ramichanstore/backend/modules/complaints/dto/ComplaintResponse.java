package com.ramichanstore.backend.modules.complaints.dto;

import com.ramichanstore.backend.modules.complaints.entity.Complaint;
import com.ramichanstore.backend.modules.complaints.entity.ComplaintStatus;
import com.ramichanstore.backend.modules.complaints.entity.ComplaintType;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ComplaintResponse(
        Long id, String folioNumber, ComplaintType type,
        String consumerFullName, String consumerDocumentType, String consumerDocumentNumber,
        String consumerAddress, String consumerEmail, String consumerPhone,
        boolean isMinor, String guardianFullName, String guardianDocumentNumber,
        String goodDescription, BigDecimal claimedAmount,
        String detail, String consumerRequest,
        ComplaintStatus status, String providerResponse, LocalDateTime respondedAt,
        LocalDateTime createdAt) {

    public static ComplaintResponse from(Complaint c) {
        return new ComplaintResponse(
                c.getId(), c.getFolioNumber(), c.getType(),
                c.getConsumerFullName(), c.getConsumerDocumentType(), c.getConsumerDocumentNumber(),
                c.getConsumerAddress(), c.getConsumerEmail(), c.getConsumerPhone(),
                c.isMinor(), c.getGuardianFullName(), c.getGuardianDocumentNumber(),
                c.getGoodDescription(), c.getClaimedAmount(),
                c.getDetail(), c.getConsumerRequest(),
                c.getStatus(), c.getProviderResponse(), c.getRespondedAt(),
                c.getCreatedAt());
    }
}

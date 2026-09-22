package com.ramichanstore.backend.modules.shipments.dto;

import com.ramichanstore.backend.modules.shipments.entity.ShipmentDocument;
import com.ramichanstore.backend.modules.shipments.entity.ShipmentDocumentType;
import java.time.LocalDateTime;

public record ShipmentDocumentResponse(
        Long id, ShipmentDocumentType documentType, String fileName, String url, LocalDateTime uploadedAt) {

    public static ShipmentDocumentResponse from(Long shipmentId, ShipmentDocument doc) {
        String url = "/api/shipments/" + shipmentId + "/documents/" + doc.getDocumentType() + "/file";
        return new ShipmentDocumentResponse(doc.getId(), doc.getDocumentType(), doc.getFileName(), url, doc.getUploadedAt());
    }
}

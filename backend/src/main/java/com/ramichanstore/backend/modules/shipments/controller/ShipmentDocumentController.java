package com.ramichanstore.backend.modules.shipments.controller;

import com.ramichanstore.backend.common.dto.ApiResponse;
import com.ramichanstore.backend.modules.shipments.dto.ShipmentDocumentResponse;
import com.ramichanstore.backend.modules.shipments.entity.ShipmentDocument;
import com.ramichanstore.backend.modules.shipments.entity.ShipmentDocumentType;
import com.ramichanstore.backend.modules.shipments.service.ShipmentService;
import com.ramichanstore.backend.security.SecurityUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Documentos de un embarque (invoice/DIF/voucher del DIF/factura), un slot
 * único por tipo. Igual que las fotos de artículo, NO es público — los
 * embarques son 100% internos.
 */
@RestController
@RequiredArgsConstructor
public class ShipmentDocumentController {

    private final ShipmentService shipmentService;

    @PostMapping("/api/shipments/{shipmentId}/documents/{type}")
    @PreAuthorize("hasAuthority('PERM_SHIPMENT_MANAGE')")
    public ApiResponse<ShipmentDocumentResponse> upload(
            @PathVariable Long shipmentId, @PathVariable ShipmentDocumentType type,
            @RequestPart("file") MultipartFile file, @AuthenticationPrincipal SecurityUser currentUser) {
        return ApiResponse.ok("Documento subido", shipmentService.uploadDocument(shipmentId, type, file, currentUser));
    }

    @DeleteMapping("/api/shipments/{shipmentId}/documents/{type}")
    @PreAuthorize("hasAuthority('PERM_SHIPMENT_MANAGE')")
    public ApiResponse<Void> delete(@PathVariable Long shipmentId, @PathVariable ShipmentDocumentType type) {
        shipmentService.deleteDocument(shipmentId, type);
        return ApiResponse.ok("Documento eliminado", null);
    }

    @GetMapping("/api/shipments/{shipmentId}/documents/{type}/file")
    @PreAuthorize("hasAuthority('PERM_SHIPMENT_VIEW')")
    public ResponseEntity<byte[]> file(@PathVariable Long shipmentId, @PathVariable ShipmentDocumentType type) {
        ShipmentDocument doc = shipmentService.findDocumentForServing(shipmentId, type);
        MediaType mediaType = doc.getContentType() != null
                ? MediaType.parseMediaType(doc.getContentType())
                : MediaType.APPLICATION_OCTET_STREAM;
        return ResponseEntity.ok()
                .contentType(mediaType)
                .cacheControl(CacheControl.noCache())
                .header("Content-Disposition", "inline; filename=\"" + doc.getFileName() + "\"")
                .body(doc.getFileData());
    }
}

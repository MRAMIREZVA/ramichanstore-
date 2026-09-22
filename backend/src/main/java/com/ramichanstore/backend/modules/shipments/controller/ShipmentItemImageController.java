package com.ramichanstore.backend.modules.shipments.controller;

import com.ramichanstore.backend.common.dto.ApiResponse;
import com.ramichanstore.backend.modules.shipments.dto.ShipmentItemResponse;
import com.ramichanstore.backend.modules.shipments.entity.ShipmentItem;
import com.ramichanstore.backend.modules.shipments.service.ShipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.concurrent.TimeUnit;

/**
 * Foto de un artículo de embarque, una sola por artículo (no galería, a
 * diferencia de ProductImage). A diferencia de las imágenes de producto,
 * acá NO hay excepción pública: los embarques son 100% internos, nunca se
 * muestran al cliente.
 */
@RestController
@RequiredArgsConstructor
public class ShipmentItemImageController {

    private final ShipmentService shipmentService;

    @PostMapping("/api/shipments/items/{itemId}/image")
    @PreAuthorize("hasAuthority('PERM_SHIPMENT_MANAGE')")
    public ApiResponse<ShipmentItemResponse> upload(@PathVariable Long itemId, @RequestPart("file") MultipartFile file) {
        return ApiResponse.ok("Imagen subida", shipmentService.uploadItemImage(itemId, file));
    }

    @DeleteMapping("/api/shipments/items/{itemId}/image")
    @PreAuthorize("hasAuthority('PERM_SHIPMENT_MANAGE')")
    public ApiResponse<Void> delete(@PathVariable Long itemId) {
        shipmentService.deleteItemImage(itemId);
        return ApiResponse.ok("Imagen eliminada", null);
    }

    @GetMapping("/api/shipments/items/{itemId}/image/file")
    @PreAuthorize("hasAuthority('PERM_SHIPMENT_VIEW')")
    public ResponseEntity<byte[]> file(@PathVariable Long itemId) {
        ShipmentItem item = shipmentService.findItemForServing(itemId);
        MediaType mediaType = item.getImageContentType() != null
                ? MediaType.parseMediaType(item.getImageContentType())
                : MediaType.APPLICATION_OCTET_STREAM;
        return ResponseEntity.ok()
                .contentType(mediaType)
                .cacheControl(CacheControl.maxAge(1, TimeUnit.DAYS))
                .body(item.getImageData());
    }
}

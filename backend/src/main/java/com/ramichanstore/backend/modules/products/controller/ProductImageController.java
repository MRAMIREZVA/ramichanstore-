package com.ramichanstore.backend.modules.products.controller;

import com.ramichanstore.backend.common.dto.ApiResponse;
import com.ramichanstore.backend.modules.products.dto.ProductImageResponse;
import com.ramichanstore.backend.modules.products.entity.ProductImage;
import com.ramichanstore.backend.modules.products.service.ProductImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.CacheControl;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.concurrent.TimeUnit;

@RestController
@RequiredArgsConstructor
public class ProductImageController {

    private final ProductImageService productImageService;

    @PostMapping("/api/products/{productId}/images")
    @PreAuthorize("hasAuthority('PERM_PRODUCT_EDIT')")
    public ApiResponse<ProductImageResponse> upload(
            @PathVariable Long productId,
            @RequestPart("file") MultipartFile file,
            @RequestParam(defaultValue = "false") boolean isMain) {
        return ApiResponse.ok("Imagen subida", productImageService.upload(productId, file, isMain));
    }

    @PutMapping("/api/products/{productId}/images/{imageId}/main")
    @PreAuthorize("hasAuthority('PERM_PRODUCT_EDIT')")
    public ApiResponse<Void> setMain(@PathVariable Long productId, @PathVariable Long imageId) {
        productImageService.setMain(productId, imageId);
        return ApiResponse.ok("Imagen marcada como principal", null);
    }

    @DeleteMapping("/api/products/{productId}/images/{imageId}")
    @PreAuthorize("hasAuthority('PERM_PRODUCT_EDIT')")
    public ApiResponse<Void> delete(@PathVariable Long productId, @PathVariable Long imageId) {
        productImageService.delete(productId, imageId);
        return ApiResponse.ok("Imagen eliminada", null);
    }

    /** Sirve el binario de la imagen. Público a propósito: se usará en el catálogo público futuro. */
    @GetMapping("/api/products/images/{imageId}/file")
    public ResponseEntity<byte[]> file(@PathVariable Long imageId) {
        ProductImage image = productImageService.getForServing(imageId);
        MediaType mediaType = image.getContentType() != null
                ? MediaType.parseMediaType(image.getContentType())
                : MediaType.APPLICATION_OCTET_STREAM;
        return ResponseEntity.ok()
                .contentType(mediaType)
                .cacheControl(CacheControl.maxAge(1, TimeUnit.DAYS))
                .body(image.getImageData());
    }
}

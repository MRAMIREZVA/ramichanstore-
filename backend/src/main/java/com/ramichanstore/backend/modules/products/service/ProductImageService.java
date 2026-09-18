package com.ramichanstore.backend.modules.products.service;

import com.ramichanstore.backend.audit.AuditAction;
import com.ramichanstore.backend.audit.AuditService;
import com.ramichanstore.backend.common.exception.BusinessRuleException;
import com.ramichanstore.backend.common.exception.ResourceNotFoundException;
import com.ramichanstore.backend.modules.products.dto.ProductImageResponse;
import com.ramichanstore.backend.modules.products.entity.Product;
import com.ramichanstore.backend.modules.products.entity.ProductImage;
import com.ramichanstore.backend.modules.products.repository.ProductImageRepository;
import com.ramichanstore.backend.modules.products.repository.ProductRepository;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * Imágenes de producto guardadas como binario en la base de datos. Solo una imagen
 * por producto puede tener isMain = true a la vez; esa es la que se usa como
 * imagen principal (ver ProductResponse.from), pensada para el catálogo futuro.
 */
@Service
@RequiredArgsConstructor
public class ProductImageService {

    private static final String MODULE = "PRODUCTS";
    private static final long MAX_IMAGE_SIZE_BYTES = 5L * 1024 * 1024;
    private static final List<String> ALLOWED_CONTENT_TYPES =
            List.of("image/jpeg", "image/png", "image/webp", "image/gif");

    private final ProductImageRepository productImageRepository;
    private final ProductRepository productRepository;
    private final AuditService auditService;

    @Transactional
    public ProductImageResponse upload(Long productId, MultipartFile file, boolean requestedMain) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> ResourceNotFoundException.of("Producto", productId));

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

        List<ProductImage> existing = productImageRepository.findByProductIdOrderBySortOrderAsc(productId);
        boolean makeMain = requestedMain || existing.isEmpty();
        if (makeMain) {
            existing.forEach(img -> img.setMain(false));
        }

        ProductImage image = new ProductImage();
        image.setProduct(product);
        image.setFileName(file.getOriginalFilename());
        image.setContentType(contentType);
        image.setMain(makeMain);
        image.setSortOrder(existing.size());
        try {
            image.setImageData(file.getBytes());
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo leer el archivo de imagen", e);
        }

        ProductImage saved = productImageRepository.save(image);
        auditService.log(AuditAction.CREATE, MODULE, "ProductImage", saved.getId().toString(),
                null, "producto=" + productId + ", archivo=" + saved.getFileName());
        return ProductImageResponse.from(saved);
    }

    @Transactional
    public void setMain(Long productId, Long imageId) {
        List<ProductImage> images = productImageRepository.findByProductIdOrderBySortOrderAsc(productId);
        ProductImage target = images.stream()
                .filter(img -> img.getId().equals(imageId))
                .findFirst()
                .orElseThrow(() -> ResourceNotFoundException.of("Imagen", imageId));

        images.forEach(img -> img.setMain(img.getId().equals(imageId)));
        productImageRepository.saveAll(images);
        auditService.log(AuditAction.UPDATE, MODULE, "ProductImage", imageId.toString(), null, "marcada como principal");
    }

    @Transactional
    public void delete(Long productId, Long imageId) {
        List<ProductImage> images = productImageRepository.findByProductIdOrderBySortOrderAsc(productId);
        ProductImage target = images.stream()
                .filter(img -> img.getId().equals(imageId))
                .findFirst()
                .orElseThrow(() -> ResourceNotFoundException.of("Imagen", imageId));

        boolean wasMain = target.isMain();
        productImageRepository.delete(target);

        if (wasMain) {
            images.stream()
                    .filter(img -> !img.getId().equals(imageId))
                    .min(Comparator.comparingInt(ProductImage::getSortOrder))
                    .ifPresent(next -> {
                        next.setMain(true);
                        productImageRepository.save(next);
                    });
        }

        auditService.log(AuditAction.DELETE, MODULE, "ProductImage", imageId.toString(),
                "producto=" + productId, null);
    }

    @Transactional(readOnly = true)
    public ProductImage getForServing(Long imageId) {
        return productImageRepository.findById(imageId)
                .orElseThrow(() -> ResourceNotFoundException.of("Imagen", imageId));
    }
}

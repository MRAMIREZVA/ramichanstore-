package com.ramichanstore.backend.modules.catalog.service;

import com.ramichanstore.backend.audit.AuditAction;
import com.ramichanstore.backend.audit.AuditService;
import com.ramichanstore.backend.common.exception.BusinessRuleException;
import com.ramichanstore.backend.common.exception.ResourceNotFoundException;
import com.ramichanstore.backend.modules.brands.service.BrandService;
import com.ramichanstore.backend.modules.catalog.dto.CatalogFilterOption;
import com.ramichanstore.backend.modules.catalog.dto.PublicProductResponse;
import com.ramichanstore.backend.modules.catalog.dto.StoreInfoResponse;
import com.ramichanstore.backend.modules.catalog.entity.CatalogBanner;
import com.ramichanstore.backend.modules.catalog.repository.CatalogBannerRepository;
import com.ramichanstore.backend.modules.categories.service.CategoryService;
import com.ramichanstore.backend.modules.products.service.ProductService;
import com.ramichanstore.backend.modules.settings.service.SettingService;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

/**
 * Fachada de solo lectura para el catálogo público (sin login) — reutiliza los
 * servicios de dominio de Productos/Categorías/Marcas tal como anticipaba la
 * arquitectura desde Fase 0, igual que PortalService (Fase 13). El mapeo a
 * PublicProductResponse ocurre acá, dentro del @Transactional, para no acceder
 * a relaciones lazy (brand/category/line/images) después de que la transacción
 * de ProductService.searchPublic ya cerró.
 */
@Service
@RequiredArgsConstructor
public class CatalogService {

    /** El banner es una tabla "singleton": a lo más una fila, siempre con este id. */
    static final long BANNER_ID = 1L;
    private static final long MAX_BANNER_SIZE_BYTES = 5L * 1024 * 1024;
    private static final List<String> ALLOWED_BANNER_TYPES =
            List.of("image/jpeg", "image/png", "image/webp", "image/gif");

    private final ProductService productService;
    private final CategoryService categoryService;
    private final BrandService brandService;
    private final SettingService settingService;
    private final CatalogBannerRepository catalogBannerRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<PublicProductResponse> searchProducts(
            String term, Long categoryId, Long brandId, String franchise, Pageable pageable) {
        return productService.searchPublic(term, categoryId, brandId, franchise, pageable).map(PublicProductResponse::from);
    }

    @Transactional(readOnly = true)
    public PublicProductResponse findProductById(Long id) {
        return PublicProductResponse.from(productService.findPublicById(id));
    }

    @Transactional(readOnly = true)
    public List<CatalogFilterOption> findCategories() {
        return categoryService.findAll().stream().map(c -> new CatalogFilterOption(c.getId(), c.getName())).toList();
    }

    @Transactional(readOnly = true)
    public List<CatalogFilterOption> findBrands() {
        return brandService.findAll().stream().map(b -> new CatalogFilterOption(b.getId(), b.getName())).toList();
    }

    /** Franquicias/animes distintos entre los productos — para agrupar/filtrar el catálogo por anime. */
    @Transactional(readOnly = true)
    public List<String> findFranchises() {
        return productService.findDistinctFranchises();
    }

    /** whatsapp/bannerUrl vienen null si el admin no los configuró — el frontend público no debe mostrar enlace/imagen rotos. */
    @Transactional(readOnly = true)
    public StoreInfoResponse getStoreInfo() {
        String storeName = settingService.getValue("STORE_NAME");
        String whatsapp = settingService.getValue("STORE_WHATSAPP");
        String bannerUrl = catalogBannerRepository.existsById(BANNER_ID) ? "/api/catalog/banner/file" : null;
        return new StoreInfoResponse(storeName, StringUtils.hasText(whatsapp) ? whatsapp : null, bannerUrl);
    }

    /**
     * Reemplaza el banner de inicio del catálogo (tabla singleton — ver {@link CatalogBanner}).
     * Mismas reglas de validación que ProductImageService (5MB, JPG/PNG/WEBP/GIF).
     */
    @Transactional
    public void uploadBanner(MultipartFile file, String username) {
        if (file.isEmpty()) {
            throw new BusinessRuleException("El archivo está vacío");
        }
        if (file.getSize() > MAX_BANNER_SIZE_BYTES) {
            throw new BusinessRuleException("La imagen no debe superar 5MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_BANNER_TYPES.contains(contentType.toLowerCase())) {
            throw new BusinessRuleException("Formato de imagen no soportado (usa JPG, PNG, WEBP o GIF)");
        }

        CatalogBanner banner = catalogBannerRepository.findById(BANNER_ID).orElseGet(CatalogBanner::new);
        banner.setId(BANNER_ID);
        banner.setFileName(file.getOriginalFilename());
        banner.setContentType(contentType);
        banner.setUpdatedAt(LocalDateTime.now());
        banner.setUpdatedBy(username);
        try {
            banner.setImageData(file.getBytes());
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo leer el archivo del banner", e);
        }
        catalogBannerRepository.save(banner);
        auditService.log(AuditAction.UPDATE, "SETTINGS", "CatalogBanner", String.valueOf(BANNER_ID),
                null, "archivo=" + banner.getFileName());
    }

    @Transactional
    public void deleteBanner() {
        if (!catalogBannerRepository.existsById(BANNER_ID)) {
            return;
        }
        catalogBannerRepository.deleteById(BANNER_ID);
        auditService.log(AuditAction.DELETE, "SETTINGS", "CatalogBanner", String.valueOf(BANNER_ID), "banner eliminado", null);
    }

    /** Para servir el binario del banner — 404 si el admin nunca subió uno. */
    @Transactional(readOnly = true)
    public CatalogBanner getBannerForServing() {
        return catalogBannerRepository.findById(BANNER_ID)
                .orElseThrow(() -> ResourceNotFoundException.of("Banner", BANNER_ID));
    }
}

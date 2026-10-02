package com.ramichanstore.backend.modules.catalog.service;

import com.ramichanstore.backend.audit.AuditAction;
import com.ramichanstore.backend.audit.AuditService;
import com.ramichanstore.backend.common.exception.BusinessRuleException;
import com.ramichanstore.backend.common.exception.ResourceNotFoundException;
import com.ramichanstore.backend.modules.brands.service.BrandService;
import com.ramichanstore.backend.modules.catalog.dto.CatalogFilterOption;
import com.ramichanstore.backend.modules.catalog.dto.PublicProductResponse;
import com.ramichanstore.backend.modules.catalog.dto.StoreInfoResponse;
import com.ramichanstore.backend.modules.catalog.entity.CatalogAnnouncement;
import com.ramichanstore.backend.modules.catalog.entity.CatalogBanner;
import com.ramichanstore.backend.modules.catalog.repository.CatalogAnnouncementRepository;
import com.ramichanstore.backend.modules.catalog.repository.CatalogBannerRepository;
import com.ramichanstore.backend.modules.categories.service.CategoryService;
import com.ramichanstore.backend.modules.deliveryagencies.dto.DeliveryAgencyResponse;
import com.ramichanstore.backend.modules.deliveryagencies.service.DeliveryAgencyService;
import com.ramichanstore.backend.modules.preorders.service.PreorderService;
import com.ramichanstore.backend.modules.productlines.service.ProductLineService;
import com.ramichanstore.backend.modules.products.entity.ProductStatus;
import com.ramichanstore.backend.modules.products.service.ProductService;
import com.ramichanstore.backend.modules.settings.service.SettingService;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
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

    /** El banner y el anuncio son tablas "singleton": a lo más una fila, siempre con este id. */
    static final long BANNER_ID = 1L;
    static final long ANNOUNCEMENT_ID = 1L;
    private static final long MAX_IMAGE_SIZE_BYTES = 5L * 1024 * 1024;
    private static final List<String> ALLOWED_IMAGE_TYPES =
            List.of("image/jpeg", "image/png", "image/webp", "image/gif");

    private final ProductService productService;
    private final PreorderService preorderService;
    private final CategoryService categoryService;
    private final BrandService brandService;
    private final ProductLineService productLineService;
    private final DeliveryAgencyService deliveryAgencyService;
    private final SettingService settingService;
    private final CatalogBannerRepository catalogBannerRepository;
    private final CatalogAnnouncementRepository catalogAnnouncementRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<PublicProductResponse> searchProducts(
            String term, Long categoryId, Long brandId, Long lineId, String franchise, boolean onlyPreorder, Pageable pageable) {
        Page<PublicProductResponse> page = productService
                .searchPublic(term, categoryId, brandId, lineId, franchise, onlyPreorder, pageable)
                .map(PublicProductResponse::from);
        // Pedido explícito del dueño: los agotados no deben aparecer mezclados con los
        // disponibles. Reordenamiento POR PÁGINA (no una ordenación global en SQL) con un
        // comparador ESTABLE — `Stream.sorted` preserva el orden relativo dentro de cada grupo,
        // así que el orden que haya elegido el visitante (nombre, anime, precio) se respeta
        // DENTRO de "disponibles" y DENTRO de "agotados", solo se separan los dos bloques. Un
        // agotado en la página 1 no salta a la última página del catálogo completo, pero deja
        // de aparecer intercalado con los disponibles de esa misma página, que era el problema
        // real reportado.
        List<PublicProductResponse> reordered = page.getContent().stream()
                .sorted(Comparator.comparing(p -> p.inStock() ? 0 : 1))
                .toList();
        return new PageImpl<>(reordered, pageable, page.getTotalElements());
    }

    @Transactional(readOnly = true)
    public PublicProductResponse findProductById(Long id) {
        var product = productService.findPublicById(id);
        // Solo se resuelve la campaña activa cuando de verdad hace falta (producto en preventa) —
        // nunca en el listado (searchProducts), para no pagar una consulta extra por producto por página.
        var preorderInfo = product.getStatus() == ProductStatus.PREORDER
                ? preorderService.findActivePublicInfo(id).orElse(null)
                : null;
        return PublicProductResponse.from(product, preorderInfo);
    }

    @Transactional(readOnly = true)
    public List<CatalogFilterOption> findCategories() {
        return categoryService.findAll().stream().map(c -> new CatalogFilterOption(c.getId(), c.getName())).toList();
    }

    @Transactional(readOnly = true)
    public List<CatalogFilterOption> findBrands() {
        return brandService.findAll().stream().map(b -> new CatalogFilterOption(b.getId(), b.getName())).toList();
    }

    /** Para el filtro "Línea" del catálogo público — mismo criterio que categorías/marcas. */
    @Transactional(readOnly = true)
    public List<CatalogFilterOption> findLines() {
        return productLineService.findAll().stream()
                .map(l -> new CatalogFilterOption(l.id(), l.name()))
                .toList();
    }

    /** Franquicias/animes distintos entre los productos — para agrupar/filtrar el catálogo por anime. */
    @Transactional(readOnly = true)
    public List<String> findFranchises() {
        return productService.findDistinctFranchises();
    }

    /** Agencias de envío (Shalom, Olva, etc.) para el checkout cuando el método de entrega es "Agencia". */
    @Transactional(readOnly = true)
    public List<DeliveryAgencyResponse> findDeliveryAgencies() {
        return deliveryAgencyService.findAll();
    }

    /**
     * whatsapp/bannerUrl/announcementImageUrl vienen null si el admin no los configuró —
     * el frontend público no debe mostrar enlace/imagen/popup rotos.
     * <p>
     * Las URLs llevan {@code ?v=<updatedAt>}: el archivo se sirve con
     * {@code Cache-Control: max-age=1h} (ver banner/announcement file), así que sin este
     * parámetro el navegador reutiliza la copia vieja en caché después de reemplazar la
     * imagen — tanto en la vista previa del admin como en el popup/banner real que ven
     * los visitantes — hasta que esa hora expirara sola. Al incluir el timestamp de la
     * última actualización, la URL cambia exactamente cuando la imagen cambia (y se
     * mantiene igual cuando no cambia nada, así que el caché de 1h sigue sirviendo para
     * el caso normal).
     */
    @Transactional(readOnly = true)
    public StoreInfoResponse getStoreInfo() {
        String storeName = settingService.getValue("STORE_NAME");
        String whatsapp = settingService.getValue("STORE_WHATSAPP");
        String bannerUrl = catalogBannerRepository.findById(BANNER_ID)
                .map(b -> "/api/catalog/banner/file?v=" + b.getUpdatedAt().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli())
                .orElse(null);
        String announcementImageUrl = catalogAnnouncementRepository.findById(ANNOUNCEMENT_ID)
                .map(a -> "/api/catalog/announcement/file?v=" + a.getUpdatedAt().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli())
                .orElse(null);
        String freeShippingRaw = settingService.getValue("FREE_SHIPPING_THRESHOLD");
        BigDecimal freeShippingThreshold = StringUtils.hasText(freeShippingRaw) ? new BigDecimal(freeShippingRaw) : null;
        String googleAnalyticsId = settingService.getValue("GOOGLE_ANALYTICS_ID");
        String metaPixelId = settingService.getValue("META_PIXEL_ID");
        // Pago con Yape por comprobante (Fase 52): sin número configurado, el checkout no
        // ofrece esa opción y Yape se sigue coordinando por WhatsApp.
        String yapeNumber = settingService.getValue("YAPE_NUMBER");
        String yapeHolderName = settingService.getValue("YAPE_HOLDER_NAME");
        // "Quiénes somos" + redes sociales en la parte superior del catálogo (Fase 76).
        String aboutUs = settingService.getValue("STORE_ABOUT_US");
        String facebookUrl = settingService.getValue("STORE_FACEBOOK_URL");
        String instagramUrl = settingService.getValue("STORE_INSTAGRAM_URL");
        String tiktokUrl = settingService.getValue("STORE_TIKTOK_URL");
        String youtubeUrl = settingService.getValue("STORE_YOUTUBE_URL");
        return new StoreInfoResponse(
                storeName, StringUtils.hasText(whatsapp) ? whatsapp : null, bannerUrl, announcementImageUrl, freeShippingThreshold,
                StringUtils.hasText(googleAnalyticsId) ? googleAnalyticsId : null,
                StringUtils.hasText(metaPixelId) ? metaPixelId : null,
                StringUtils.hasText(yapeNumber) ? yapeNumber : null,
                StringUtils.hasText(yapeHolderName) ? yapeHolderName : null,
                StringUtils.hasText(aboutUs) ? aboutUs : null,
                StringUtils.hasText(facebookUrl) ? facebookUrl : null,
                StringUtils.hasText(instagramUrl) ? instagramUrl : null,
                StringUtils.hasText(tiktokUrl) ? tiktokUrl : null,
                StringUtils.hasText(youtubeUrl) ? youtubeUrl : null);
    }

    /**
     * Reemplaza el banner de inicio del catálogo (tabla singleton — ver {@link CatalogBanner}).
     * Mismas reglas de validación que ProductImageService (5MB, JPG/PNG/WEBP/GIF).
     */
    @Transactional
    public void uploadBanner(MultipartFile file, String username) {
        String contentType = validateImage(file);
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

    /**
     * Reemplaza la imagen del panel flotante de bienvenida (tabla singleton — ver
     * {@link CatalogAnnouncement}). Mismas reglas de validación que el banner (5MB,
     * JPG/PNG/WEBP/GIF). Por ahora solo imagen — sin texto/link, a pedido del dueño.
     */
    @Transactional
    public void uploadAnnouncement(MultipartFile file, String username) {
        String contentType = validateImage(file);
        CatalogAnnouncement announcement =
                catalogAnnouncementRepository.findById(ANNOUNCEMENT_ID).orElseGet(CatalogAnnouncement::new);
        announcement.setId(ANNOUNCEMENT_ID);
        announcement.setFileName(file.getOriginalFilename());
        announcement.setContentType(contentType);
        announcement.setUpdatedAt(LocalDateTime.now());
        announcement.setUpdatedBy(username);
        try {
            announcement.setImageData(file.getBytes());
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo leer el archivo del anuncio", e);
        }
        catalogAnnouncementRepository.save(announcement);
        auditService.log(AuditAction.UPDATE, "SETTINGS", "CatalogAnnouncement", String.valueOf(ANNOUNCEMENT_ID),
                null, "archivo=" + announcement.getFileName());
    }

    @Transactional
    public void deleteAnnouncement() {
        if (!catalogAnnouncementRepository.existsById(ANNOUNCEMENT_ID)) {
            return;
        }
        catalogAnnouncementRepository.deleteById(ANNOUNCEMENT_ID);
        auditService.log(AuditAction.DELETE, "SETTINGS", "CatalogAnnouncement", String.valueOf(ANNOUNCEMENT_ID),
                "anuncio eliminado", null);
    }

    /** Para servir el binario del anuncio — 404 si el admin nunca subió uno. */
    @Transactional(readOnly = true)
    public CatalogAnnouncement getAnnouncementForServing() {
        return catalogAnnouncementRepository.findById(ANNOUNCEMENT_ID)
                .orElseThrow(() -> ResourceNotFoundException.of("Anuncio", ANNOUNCEMENT_ID));
    }

    private String validateImage(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BusinessRuleException("El archivo está vacío");
        }
        if (file.getSize() > MAX_IMAGE_SIZE_BYTES) {
            throw new BusinessRuleException("La imagen no debe superar 5MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            throw new BusinessRuleException("Formato de imagen no soportado (usa JPG, PNG, WEBP o GIF)");
        }
        return contentType;
    }
}

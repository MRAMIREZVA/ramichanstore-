package com.ramichanstore.backend.modules.catalog.controller;

import com.ramichanstore.backend.common.dto.ApiResponse;
import com.ramichanstore.backend.common.dto.PageResponse;
import com.ramichanstore.backend.common.exception.ResourceNotFoundException;
import com.ramichanstore.backend.modules.analytics.dto.CatalogTrackRequest;
import com.ramichanstore.backend.modules.analytics.service.CatalogTrackingService;
import com.ramichanstore.backend.modules.catalog.dto.CatalogFilterOption;
import com.ramichanstore.backend.modules.catalog.dto.PublicProductResponse;
import com.ramichanstore.backend.modules.catalog.dto.StoreInfoResponse;
import com.ramichanstore.backend.modules.catalog.entity.CatalogAnnouncement;
import com.ramichanstore.backend.modules.catalog.entity.CatalogBanner;
import com.ramichanstore.backend.modules.catalog.service.CatalogService;
import com.ramichanstore.backend.modules.deliveryagencies.dto.DeliveryAgencyResponse;
import com.ramichanstore.backend.security.SecurityUser;
import jakarta.validation.Valid;
import java.math.RoundingMode;
import java.util.List;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Catálogo público, sin autenticación (ver SecurityConfig — permitAll a
 * "/api/catalog/**" en GET). Vitrina de solo lectura para visitantes que no
 * son clientes con acceso al portal (ver Fase 13) ni staff: no expone nada de
 * costos/ganancia/ubicación/proveedor (ver PublicProductResponse) y nunca
 * lista productos DISCONTINUED ni OUT_OF_STOCK (ver ProductService.searchPublic/findPublicById).
 */
@RestController
@RequestMapping("/api/catalog")
@RequiredArgsConstructor
public class CatalogController {

    private final CatalogService catalogService;
    private final CatalogTrackingService catalogTrackingService;

    @Value("${app.public-url}")
    private String publicUrl;

    @GetMapping("/products")
    public ApiResponse<PageResponse<PublicProductResponse>> searchProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) Long lineId,
            @RequestParam(required = false) String franchise,
            @RequestParam(required = false, defaultValue = "false") boolean onlyPreorder,
            @PageableDefault(size = 24, sort = "name") Pageable pageable) {
        var page = catalogService.searchProducts(search, categoryId, brandId, lineId, franchise, onlyPreorder, pageable);
        return ApiResponse.ok(PageResponse.from(page));
    }

    @GetMapping("/products/{id}")
    public ApiResponse<PublicProductResponse> findProductById(@PathVariable Long id) {
        return ApiResponse.ok(catalogService.findProductById(id));
    }

    /**
     * Fase 46 — vista previa para compartir un producto por WhatsApp/Facebook/etc. Estos bots
     * NO ejecutan JavaScript: leen el HTML crudo del primer GET y sacan sus meta tags "og:*" de
     * ahí, así que la SPA de Angular (que arma su `<title>`/meta tags en el navegador, después)
     * siempre les mostraba el logo/descripción genérica de `index.html`, sin importar qué
     * producto se compartiera. `nginx.conf` detecta esos bots por User-Agent y, SOLO para ellos,
     * proxea `/catalogo/{id}` a este endpoint en vez de servir la SPA — un visitante humano nunca
     * llega acá (y si llegara por error, el `http-equiv="refresh"` lo manda a la página real).
     * Nunca se devuelve el error 404 en JSON (`ApiResponse`) de siempre — un bot de redes
     * sociales espera HTML, así que un producto no encontrado cae a una vista previa genérica
     * apuntando al catálogo, en vez de dejar que `GlobalExceptionHandler` conteste JSON.
     */
    @GetMapping(value = "/products/{id}/preview", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> productSharePreview(@PathVariable Long id) {
        String catalogUrl = publicUrl + "/catalogo";
        PublicProductResponse product;
        try {
            product = catalogService.findProductById(id);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .contentType(MediaType.TEXT_HTML)
                    .body(redirectHtml(catalogUrl));
        }
        String pageUrl = catalogUrl + "/" + product.id();
        String imageUrl = product.mainImageUrl() != null ? publicUrl + product.mainImageUrl() : publicUrl + "/logo.png";
        String title = escapeHtml(product.name() + " — RamichanStore");
        String priceLabel = "S/ " + product.salePrice().setScale(2, RoundingMode.HALF_UP);
        String description = escapeHtml(
                priceLabel + (product.franchise() != null ? " — " + product.franchise() : "")
                        + ". Figuras y coleccionables originales en RamichanStore.");
        String html = """
                <!DOCTYPE html>
                <html lang="es">
                <head>
                <meta charset="utf-8">
                <title>%s</title>
                <meta property="og:type" content="product">
                <meta property="og:title" content="%s">
                <meta property="og:description" content="%s">
                <meta property="og:image" content="%s">
                <meta property="og:url" content="%s">
                <meta name="twitter:card" content="summary_large_image">
                <meta http-equiv="refresh" content="0; url=%s">
                </head>
                <body>Redirigiendo a RamichanStore…</body>
                </html>
                """.formatted(title, title, description, imageUrl, pageUrl, pageUrl);
        return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(html);
    }

    private static String redirectHtml(String url) {
        return "<!DOCTYPE html><html><head><meta http-equiv=\"refresh\" content=\"0; url=" + url + "\"></head><body></body></html>";
    }

    private static String escapeHtml(String s) {
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    @GetMapping("/categories")
    public ApiResponse<List<CatalogFilterOption>> findCategories() {
        return ApiResponse.ok(catalogService.findCategories());
    }

    @GetMapping("/brands")
    public ApiResponse<List<CatalogFilterOption>> findBrands() {
        return ApiResponse.ok(catalogService.findBrands());
    }

    @GetMapping("/lines")
    public ApiResponse<List<CatalogFilterOption>> findLines() {
        return ApiResponse.ok(catalogService.findLines());
    }

    @GetMapping("/delivery-agencies")
    public ApiResponse<List<DeliveryAgencyResponse>> findDeliveryAgencies() {
        return ApiResponse.ok(catalogService.findDeliveryAgencies());
    }

    @GetMapping("/store-info")
    public ApiResponse<StoreInfoResponse> storeInfo() {
        return ApiResponse.ok(catalogService.getStoreInfo());
    }

    @GetMapping("/franchises")
    public ApiResponse<List<String>> findFranchises() {
        return ApiResponse.ok(catalogService.findFranchises());
    }

    /**
     * Tracking de primera parte (Fase 63) — visitas a /catalogo y vistas de ficha de
     * producto, para verlas dentro de Reportes. Público a propósito (ver SecurityConfig),
     * fire-and-forget: nunca debe romper la experiencia del visitante.
     */
    @PostMapping("/track")
    public ApiResponse<Void> track(@Valid @RequestBody CatalogTrackRequest request) {
        catalogTrackingService.registerView(request);
        return ApiResponse.ok(null);
    }

    @PostMapping("/banner")
    @PreAuthorize("hasAuthority('PERM_CATALOG_MANAGE')")
    public ApiResponse<Void> uploadBanner(
            @RequestPart("file") MultipartFile file, @AuthenticationPrincipal SecurityUser currentUser) {
        catalogService.uploadBanner(file, currentUser.getUsername());
        return ApiResponse.ok("Banner actualizado", null);
    }

    @DeleteMapping("/banner")
    @PreAuthorize("hasAuthority('PERM_CATALOG_MANAGE')")
    public ApiResponse<Void> deleteBanner() {
        catalogService.deleteBanner();
        return ApiResponse.ok("Banner eliminado", null);
    }

    /** Sirve el binario del banner. Público a propósito, como las imágenes de producto. */
    @GetMapping("/banner/file")
    public ResponseEntity<byte[]> bannerFile() {
        CatalogBanner banner = catalogService.getBannerForServing();
        MediaType mediaType = MediaType.parseMediaType(banner.getContentType());
        return ResponseEntity.ok()
                .contentType(mediaType)
                .cacheControl(CacheControl.maxAge(1, TimeUnit.HOURS))
                .body(banner.getImageData());
    }

    @PostMapping("/announcement")
    @PreAuthorize("hasAuthority('PERM_CATALOG_MANAGE')")
    public ApiResponse<Void> uploadAnnouncement(
            @RequestPart("file") MultipartFile file, @AuthenticationPrincipal SecurityUser currentUser) {
        catalogService.uploadAnnouncement(file, currentUser.getUsername());
        return ApiResponse.ok("Anuncio actualizado", null);
    }

    @DeleteMapping("/announcement")
    @PreAuthorize("hasAuthority('PERM_CATALOG_MANAGE')")
    public ApiResponse<Void> deleteAnnouncement() {
        catalogService.deleteAnnouncement();
        return ApiResponse.ok("Anuncio eliminado", null);
    }

    /** Sirve el binario del panel de bienvenida. Público a propósito, como el banner. */
    @GetMapping("/announcement/file")
    public ResponseEntity<byte[]> announcementFile() {
        CatalogAnnouncement announcement = catalogService.getAnnouncementForServing();
        MediaType mediaType = MediaType.parseMediaType(announcement.getContentType());
        return ResponseEntity.ok()
                .contentType(mediaType)
                .cacheControl(CacheControl.maxAge(1, TimeUnit.HOURS))
                .body(announcement.getImageData());
    }
}

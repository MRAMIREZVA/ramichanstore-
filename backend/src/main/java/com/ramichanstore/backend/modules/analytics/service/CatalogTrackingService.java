package com.ramichanstore.backend.modules.analytics.service;

import com.ramichanstore.backend.modules.analytics.dto.CatalogTrackRequest;
import com.ramichanstore.backend.modules.analytics.entity.CatalogEventType;
import com.ramichanstore.backend.modules.analytics.entity.CatalogPageView;
import com.ramichanstore.backend.modules.analytics.repository.CatalogPageViewRepository;
import com.ramichanstore.backend.modules.products.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Tracking de primera parte del catálogo público (Fase 63) — el dueño quería ver
 * visitas/vistas de producto DENTRO del propio sistema (Reportes), no solo en
 * Google Analytics/Meta Pixel (AnalyticsService del frontend, Fase 47). Es
 * telemetría anónima: nunca pasa por AuditService (no es una operación de
 * negocio) y nunca debe romper la experiencia del visitante — un productId
 * viejo/inexistente se ignora en silencio en vez de lanzar un error.
 */
@Service
@RequiredArgsConstructor
public class CatalogTrackingService {

    private final CatalogPageViewRepository catalogPageViewRepository;
    private final ProductRepository productRepository;

    @Transactional
    public void registerView(CatalogTrackRequest request) {
        CatalogPageView view = new CatalogPageView();
        view.setEventType(request.eventType());
        view.setVisitorId(request.visitorId());
        if (request.eventType() == CatalogEventType.PRODUCT_VIEW && request.productId() != null) {
            productRepository.findById(request.productId()).ifPresent(view::setProduct);
        }
        catalogPageViewRepository.save(view);
    }
}

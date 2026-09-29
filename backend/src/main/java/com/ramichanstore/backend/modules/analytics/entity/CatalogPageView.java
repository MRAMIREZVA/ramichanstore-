package com.ramichanstore.backend.modules.analytics.entity;

import com.ramichanstore.backend.modules.products.entity.Product;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Registro inmutable de tráfico del catálogo público (Fase 63): una visita a
 * `/catalogo` o la vista de la ficha de un producto. Ledger append-only, igual
 * criterio que InventoryMovement/AuditLog/LoyaltyPointMovement — una vez creado
 * nunca se edita ni se borra, por eso no extiende BaseEntity.
 */
@Entity
@Table(name = "catalog_page_views")
@Getter
@Setter
@NoArgsConstructor
public class CatalogPageView {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 20)
    private CatalogEventType eventType;

    /** Null para CATALOG_HOME — solo PRODUCT_VIEW referencia un producto. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "visitor_id", nullable = false, length = 64)
    private String visitorId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}

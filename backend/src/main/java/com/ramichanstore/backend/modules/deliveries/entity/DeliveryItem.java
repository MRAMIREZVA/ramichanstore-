package com.ramichanstore.backend.modules.deliveries.entity;

import com.ramichanstore.backend.modules.sales.entity.Sale;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Una compra (venta o separación — ambas son {@link Sale}, ver SaleType) agrupada dentro de una
 * {@link Delivery}. Hijo sin ciclo de vida propio (cascade ALL + orphanRemoval desde Delivery),
 * igual que SaleDetail/ProductImage — no extiende BaseEntity.
 *
 * <p>Antes de la fusión de Ventas/Separaciones esta tabla tenía DOS columnas FK nullable
 * (sale_id/separation_id, exactamente una no-null) — ya no hace falta ese patrón dual porque
 * ambos tipos de compra son la misma entidad ahora.</p>
 */
@Entity
@Table(name = "delivery_items")
@Getter
@Setter
@NoArgsConstructor
public class DeliveryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_id", nullable = false)
    private Delivery delivery;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id", nullable = false)
    private Sale sale;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}

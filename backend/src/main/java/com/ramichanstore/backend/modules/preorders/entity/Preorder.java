package com.ramichanstore.backend.modules.preorders.entity;

import com.ramichanstore.backend.common.base.BaseEntity;
import com.ramichanstore.backend.modules.products.entity.Product;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;

/**
 * Campaña de preventa ligada a un producto existente: nombre, imagen, línea,
 * marca, tamaño, precio y costo se leen de {@link Product} (no se duplican
 * aquí). Esta entidad solo guarda lo específico de la campaña.
 */
@Entity
@Table(name = "preorders")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
public class Preorder extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "min_deposit_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal minDepositAmount;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "limit_date", nullable = false)
    private LocalDate limitDate;

    @Column(name = "estimated_arrival_date")
    private LocalDate estimatedArrivalDate;

    @Column(name = "available_quantity", nullable = false)
    private int availableQuantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PreorderStatus status = PreorderStatus.COMING_SOON;

    @Column(length = 500)
    private String notes;
}

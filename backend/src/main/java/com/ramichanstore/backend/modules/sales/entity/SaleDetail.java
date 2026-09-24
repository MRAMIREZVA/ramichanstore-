package com.ramichanstore.backend.modules.sales.entity;

import com.ramichanstore.backend.modules.products.entity.Product;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Línea de detalle de una venta. Hijo sin ciclo de vida propio de {@link Sale} (cascade ALL +
 * orphanRemoval desde el padre — igual que ProductImage). unitCost es un snapshot inmutable del
 * momento de la venta (nunca se toca después). unitPrice/discount SÍ se pueden corregir después
 * de creada (ej. un error de tipeo) vía SaleService.updateItems — producto y cantidad quedan
 * siempre fijos, así que nunca hace falta ajustar stock por una corrección de precio.
 */
@Entity
@Table(name = "sale_details")
@Getter
@Setter
@NoArgsConstructor
public class SaleDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id", nullable = false)
    private Sale sale;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(name = "unit_cost", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitCost;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;
}

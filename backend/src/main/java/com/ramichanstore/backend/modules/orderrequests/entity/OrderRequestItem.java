package com.ramichanstore.backend.modules.orderrequests.entity;

import com.ramichanstore.backend.modules.preorders.entity.Preorder;
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
 * Línea de un pedido web. Hijo sin ciclo de vida propio (cascade ALL +
 * orphanRemoval desde OrderRequest, igual que SaleDetail) — unitPrice es un
 * snapshot del precio de venta del producto al momento del submit.
 */
@Entity
@Table(name = "order_request_items")
@Getter
@Setter
@NoArgsConstructor
public class OrderRequestItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_request_id", nullable = false)
    private OrderRequest orderRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    /** Campaña de preventa resuelta al momento del submit — solo cuando el producto estaba en PREORDER. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "preorder_id")
    private Preorder preorder;
}

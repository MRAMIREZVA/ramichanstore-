package com.ramichanstore.backend.modules.separations.entity;

import com.ramichanstore.backend.common.base.BaseEntity;
import com.ramichanstore.backend.modules.customers.entity.Customer;
import com.ramichanstore.backend.modules.products.entity.Product;
import com.ramichanstore.backend.modules.sales.entity.PaymentStatus;
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
 * Reserva UN producto YA EN STOCK para un cliente que lo paga en abonos —
 * distinto de una preventa (Fase 4), donde el producto todavía no llega.
 * Reutiliza {@link PaymentStatus} de Sales: mismo vocabulario de estados.
 * amountPaid/balanceDue NO se guardan aquí: se calculan sumando `payments`.
 */
@Entity
@Table(name = "separations")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
public class Separation extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "total_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalPrice;

    @Column(name = "separation_date", nullable = false)
    private LocalDate separationDate;

    @Column(name = "limit_date", nullable = false)
    private LocalDate limitDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(length = 500)
    private String notes;
}

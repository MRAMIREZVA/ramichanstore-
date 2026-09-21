package com.ramichanstore.backend.modules.sales.entity;

import com.ramichanstore.backend.common.base.BaseEntity;
import com.ramichanstore.backend.modules.customers.entity.Customer;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;

/**
 * Cabecera de venta. Total/costo/ganancia/puntos SIEMPRE se calculan en
 * {@code SaleService}, nunca se aceptan editados desde el frontend. No hay
 * UPDATE de venta: solo creación y cancelación (ver SaleService.cancel).
 */
@Entity
@Table(name = "sales")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
public class Sale extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @Column(name = "sale_date", nullable = false)
    private LocalDate saleDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 20)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 20)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_method", nullable = false, length = 20)
    private DeliveryMethod deliveryMethod;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal total;

    @Column(name = "total_cost", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalCost;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal profit;

    @Column(name = "points_generated", nullable = false)
    private int pointsGenerated;

    @Column(length = 500)
    private String notes;

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<SaleDetail> items = new ArrayList<>();
}

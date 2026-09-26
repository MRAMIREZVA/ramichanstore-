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
 * Cabecera de venta — cubre AMBOS tipos de compra que antes eran entidades separadas:
 * {@code type=VENTA} (pago de una sola vez, requiere paymentMethod/deliveryMethod, genera
 * puntos de fidelidad) y {@code type=SEPARACION} (producto ya en stock pagado en abonos vía
 * el ledger {@link Payment}, paymentMethod/deliveryMethod quedan null porque nunca existieron
 * a nivel de cabecera, jamás genera puntos). Ver {@code SaleService} para el detalle de qué
 * cambia según el tipo — la fusión es de datos, no de reglas de negocio.
 *
 * <p>Total/costo/ganancia/puntos SIEMPRE se calculan en {@code SaleService}, nunca se aceptan
 * editados desde el frontend. No hay UPDATE de cabecera libre: solo creación, cancelación,
 * corrección de líneas/agregar línea (ver SaleService), y para SEPARACION el ledger de abonos.</p>
 */
@Entity
@Table(name = "sales")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
public class Sale extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "sale_type", nullable = false, length = 20)
    private SaleType type = SaleType.VENTA;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @Column(name = "sale_date", nullable = false)
    private LocalDate saleDate;

    /** Nullable: solo obligatorio para {@code type=VENTA} (validado en SaleService, no en la BD). */
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 20)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 20)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    /** Nullable: solo obligatorio para {@code type=VENTA} (validado en SaleService, no en la BD). */
    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_method", length = 20)
    private DeliveryMethod deliveryMethod;

    /** Solo tiene sentido para {@code type=SEPARACION} — fecha límite de pago de los abonos. */
    @Column(name = "limit_date")
    private LocalDate limitDate;

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

    /** Ledger de abonos — en la práctica solo tiene filas cuando {@code type=SEPARACION}. */
    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Payment> payments = new ArrayList<>();
}

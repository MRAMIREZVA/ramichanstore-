package com.ramichanstore.backend.modules.deliveries.entity;

import com.ramichanstore.backend.common.base.BaseEntity;
import com.ramichanstore.backend.modules.customers.entity.Customer;
import com.ramichanstore.backend.modules.sales.entity.DeliveryMethod;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;

/**
 * Seguimiento logístico por CLIENTE (no por venta — ver Fase 17): una misma
 * entrega puede agrupar varias compras (ventas y/o separaciones) de ese
 * cliente, vía {@link DeliveryItem}.
 */
@Entity
@Table(name = "deliveries")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
public class Delivery extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @OneToMany(mappedBy = "delivery", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id")
    private List<DeliveryItem> items = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_type", nullable = false, length = 20)
    private DeliveryMethod deliveryType;

    @Column(length = 255)
    private String address;

    @Column(length = 100)
    private String district;

    /** Los 25 departamentos del Perú, fijos — el frontend los ofrece como combo cerrado para que las estadísticas de "de dónde son los clientes" no se fragmenten por variaciones de tipeo. */
    @Column(length = 100)
    private String department;

    @Column(length = 100)
    private String province;

    @Column(length = 150)
    private String agency;

    @Column(length = 150)
    private String courier;

    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DeliveryStatus status = DeliveryStatus.PENDING;

    @Column(length = 500)
    private String notes;
}

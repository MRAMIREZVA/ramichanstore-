package com.ramichanstore.backend.modules.shipments.entity;

import com.ramichanstore.backend.common.base.BaseEntity;
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
 * Embarque consolidado desde Japón (digitaliza la planilla Excel que se
 * llevaba a mano). "Días en ruta" y "diferencia de peso" no se guardan: se
 * calculan al leer (ver ShipmentResponse), mismo criterio del resto del
 * proyecto para valores derivables.
 */
@Entity
@Table(name = "shipments")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
public class Shipment extends BaseEntity {

    @Column(nullable = false, length = 50)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "holder_id", nullable = false)
    private ShipmentHolder holder;

    @Column(name = "zen_order_number", length = 50)
    private String zenOrderNumber;

    @Column(name = "product_cost", precision = 10, scale = 2)
    private BigDecimal productCost;

    @Column(name = "shipping_cost", precision = 10, scale = 2)
    private BigDecimal shippingCost;

    @Column(name = "commission_cost", precision = 10, scale = 2)
    private BigDecimal commissionCost;

    @Column(name = "domestic_japan_shipping_cost", precision = 10, scale = 2)
    private BigDecimal domesticJapanShippingCost;

    @Column(name = "additional_cost", precision = 10, scale = 2)
    private BigDecimal additionalCost;

    @Column(name = "total_soles", precision = 10, scale = 2)
    private BigDecimal totalSoles;

    @Column(name = "total_dollars", precision = 10, scale = 2)
    private BigDecimal totalDollars;

    @Column(name = "handling_cost", precision = 10, scale = 2)
    private BigDecimal handlingCost;

    @Column(name = "final_cost", precision = 10, scale = 2)
    private BigDecimal finalCost;

    @Enumerated(EnumType.STRING)
    @Column(name = "shipment_type", nullable = false, length = 20)
    private ShipmentType shipmentType;

    @Column(name = "departure_date")
    private LocalDate departureDate;

    @Column(name = "arrival_date")
    private LocalDate arrivalDate;

    @Column(name = "travel_days")
    private Integer travelDays;

    @Column(name = "possible_arrival_date")
    private LocalDate possibleArrivalDate;

    @Column(name = "figures_weight", precision = 10, scale = 2)
    private BigDecimal figuresWeight;

    @Column(name = "final_weight", precision = 10, scale = 2)
    private BigDecimal finalWeight;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ShipmentStatus status = ShipmentStatus.PENDIENTE_ENVIO;

    @Column(length = 500)
    private String notes;

    @OneToMany(mappedBy = "shipment", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ShipmentItem> items = new ArrayList<>();
}

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
 * llevaba a mano). "Días en ruta", "diferencia de peso" y los 3 totales de
 * costo (totalDollars/totalSoles/finalCost) no se guardan: se calculan al
 * leer (ver ShipmentResponse), mismo criterio del resto del proyecto para
 * valores derivables.
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

    /**
     * A nombre de quien va el paquete físicamente (aduanas/envío) — distinto de
     * {@link #holder} (quien hace la compra con su cuenta ZEN). Nullable a nivel
     * de columna porque la maestra pudo nacer después de embarques ya existentes
     * (ver V20); {@code ShipmentRequest} sí lo exige para altas/ediciones nuevas.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id")
    private ShipmentRecipient recipient;

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

    @Column(name = "handling_cost", precision = 10, scale = 2)
    private BigDecimal handlingCost;

    /**
     * Monto opcional que suma SOLO al Costo final (no al Total (S/)), igual que Gastos
     * movibles — no todos los barcos pagan aduana. Distinto del monto informativo
     * customsTaxAmount de la sección Aduanas (que no entra en ningún total, ver Fase 23).
     */
    @Column(name = "customs_charge", precision = 10, scale = 2)
    private BigDecimal customsCharge;

    /** Tipo de cambio US$→S/ de la semana de este embarque (varía embarque a embarque). */
    @Column(name = "exchange_rate", precision = 10, scale = 4)
    private BigDecimal exchangeRate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shipment_type_id", nullable = false)
    private ShipmentTypeOption shipmentType;

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

    @Column(name = "went_through_customs", nullable = false)
    private boolean wentThroughCustoms = false;

    @Column(name = "customs_tax_amount", precision = 10, scale = 2)
    private BigDecimal customsTaxAmount;

    // Sin orphanRemoval a propósito desde Fase 40 (ver Javadoc de ShipmentItem) — "quitar" un
    // artículo de este embarque debe liberarlo al pool pendiente (shipment = null), no borrarlo.
    @OneToMany(mappedBy = "shipment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ShipmentItem> items = new ArrayList<>();

    /** Sin cascade: los documentos se gestionan con sus propios endpoints de upload/delete, no vía ShipmentRequest. */
    @OneToMany(mappedBy = "shipment", fetch = FetchType.LAZY)
    private List<ShipmentDocument> documents = new ArrayList<>();
}

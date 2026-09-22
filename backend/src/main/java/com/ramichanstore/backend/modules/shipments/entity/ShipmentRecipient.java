package com.ramichanstore.backend.modules.shipments.entity;

import com.ramichanstore.backend.common.base.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;

/**
 * Titular del EMBARQUE: a nombre de quien va el paquete físicamente (para
 * aduanas/envío) — distinto de {@link ShipmentHolder} (quien hace la compra
 * con su cuenta ZEN). El nombre SÍ puede repetirse a propósito: dos embarques
 * distintos pueden ir a nombre de la misma persona, y no hay necesidad de
 * unicidad de negocio acá.
 */
@Entity
@Table(name = "shipment_recipients")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
public class ShipmentRecipient extends BaseEntity {

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 255)
    private String notes;
}

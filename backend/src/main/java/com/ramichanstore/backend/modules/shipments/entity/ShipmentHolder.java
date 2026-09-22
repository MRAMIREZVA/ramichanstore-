package com.ramichanstore.backend.modules.shipments.entity;

import com.ramichanstore.backend.common.base.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;

/** Titular de una cuenta de compra (ej. Zenmarket) usada para consolidar embarques desde Japón. */
@Entity
@Table(name = "shipment_holders")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
public class ShipmentHolder extends BaseEntity {

    @Column(nullable = false, unique = true, length = 150)
    private String name;

    @Column(name = "zen_account", length = 50)
    private String zenAccount;

    @Column(length = 255)
    private String notes;
}

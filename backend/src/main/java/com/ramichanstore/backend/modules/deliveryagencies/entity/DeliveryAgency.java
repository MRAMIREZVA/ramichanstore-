package com.ramichanstore.backend.modules.deliveryagencies.entity;

import com.ramichanstore.backend.common.base.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;

/**
 * Maestro de agencias de envío (Shalom, Olva Courier, etc.) — editable por el
 * admin desde Configuración, mismo patrón que {@code ShipmentTypeOption}
 * (Fase 25). Usada tanto por Entregas (admin) como por el checkout del
 * catálogo público cuando el método de entrega es "Envío por agencia".
 */
@Entity
@Table(name = "delivery_agencies")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
public class DeliveryAgency extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String name;
}

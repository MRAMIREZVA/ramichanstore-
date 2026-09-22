package com.ramichanstore.backend.modules.shipments.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Línea de detalle de un embarque (qué trae). Hijo sin ciclo de vida propio
 * (cascade ALL + orphanRemoval desde Shipment, igual que SaleDetail). Texto
 * libre a propósito: los códigos internos del proveedor no coinciden con el
 * formato de SKU que ya usa el catálogo.
 */
@Entity
@Table(name = "shipment_items")
@Getter
@Setter
@NoArgsConstructor
public class ShipmentItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shipment_id", nullable = false)
    private Shipment shipment;

    @Column(name = "article_code", length = 50)
    private String articleCode;

    @Column(nullable = false, length = 300)
    private String description;

    @Column(nullable = false)
    private int quantity;
}

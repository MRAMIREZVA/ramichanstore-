package com.ramichanstore.backend.modules.shipments.entity;

import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Artículo de embarque (qué trae) — hijo sin ciclo de vida propio (cascade
 * ALL desde Shipment, igual que SaleDetail, pero SIN orphanRemoval: ver más
 * abajo). Texto libre a propósito: los códigos internos del proveedor no
 * coinciden con el formato de SKU que ya usa el catálogo.
 *
 * Desde Fase 40, {@code shipment} es OPCIONAL: un artículo se puede
 * pre-registrar (peso, costo, foto) antes de saber a qué embarque va a ir —
 * {@code shipment == null} significa "pendiente, en el pool". Por eso NO
 * lleva {@code orphanRemoval}: "sacar" un artículo de la lista de un embarque
 * (`Shipment.items`) debe LIBERARLO (volver al pool, `shipment = null`), no
 * borrarlo — con orphanRemoval, Hibernate emitiría un DELETE en vez de un
 * simple UPDATE del FK. Borrar de verdad un artículo pendiente es una acción
 * aparte (`ShipmentService.deletePendingItem`).
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
    @JoinColumn(name = "shipment_id")
    private Shipment shipment;

    @Column(name = "article_code", length = 50)
    private String articleCode;

    @Column(nullable = false, length = 300)
    private String description;

    @Column(nullable = false)
    private int quantity;

    /** Gramos — obligatorio (validado en ShipmentItemRequest), a diferencia del resto de campos de costo. */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal weight;

    @Column(precision = 10, scale = 2)
    private BigDecimal cost;

    @Column(precision = 10, scale = 2)
    private BigDecimal commission;

    @Column(name = "transaction_surcharge", precision = 10, scale = 2)
    private BigDecimal transactionSurcharge;

    @Column(name = "image_file_name", length = 255)
    private String imageFileName;

    @Column(name = "image_content_type", length = 100)
    private String imageContentType;

    @Lob
    @Basic(fetch = FetchType.LAZY)
    @Column(name = "image_data")
    private byte[] imageData;
}

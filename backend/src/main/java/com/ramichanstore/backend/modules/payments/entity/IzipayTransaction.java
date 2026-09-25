package com.ramichanstore.backend.modules.payments.entity;

import com.ramichanstore.backend.modules.orderrequests.entity.OrderRequest;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Ledger append-only de cada intento de pago con Yape (vía Izipay) contra un {@link OrderRequest}
 * — no extiende BaseEntity (sin soft delete, sin updated_at): mismo criterio que InventoryMovement/
 * Payment (separaciones), nunca se borra, solo se completa cuando llega la notificación IPN de
 * Izipay. Puede haber más de una fila por pedido si el cliente reintenta el pago.
 */
@Entity
@Table(name = "izipay_transactions")
@Getter
@Setter
@NoArgsConstructor
public class IzipayTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_request_id", nullable = false)
    private OrderRequest orderRequest;

    @Column(name = "izipay_order_id", nullable = false, length = 50)
    private String izipayOrderId;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private IzipayTransactionStatus status = IzipayTransactionStatus.PENDING;

    @Column(name = "transaction_uuid", length = 100)
    private String transactionUuid;

    @Column(name = "raw_ipn_payload", columnDefinition = "NVARCHAR(MAX)")
    private String rawIpnPayload;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;
}

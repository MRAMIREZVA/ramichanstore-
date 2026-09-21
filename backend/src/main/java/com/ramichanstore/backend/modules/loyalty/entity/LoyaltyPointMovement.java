package com.ramichanstore.backend.modules.loyalty.entity;

import com.ramichanstore.backend.modules.customers.entity.Customer;
import com.ramichanstore.backend.modules.sales.entity.Sale;
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
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Ledger inmutable de puntos: igual que AuditLog/InventoryMovement/Payment, no
 * extiende BaseEntity. El saldo de un cliente es SIEMPRE
 * SUM(points) de sus movimientos — nunca un contador guardado aparte.
 */
@Entity
@Table(name = "loyalty_point_movements")
@Getter
@Setter
@NoArgsConstructor
public class LoyaltyPointMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false, length = 20)
    private LoyaltyMovementType movementType;

    @Column(nullable = false)
    private int points;

    @Column(nullable = false, length = 255)
    private String reason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id")
    private Sale sale;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 50)
    private String username;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}

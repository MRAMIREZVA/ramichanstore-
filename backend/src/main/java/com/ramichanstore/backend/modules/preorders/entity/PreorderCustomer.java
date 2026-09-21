package com.ramichanstore.backend.modules.preorders.entity;

import com.ramichanstore.backend.common.base.BaseEntity;
import com.ramichanstore.backend.modules.customers.entity.Customer;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;

/** Reserva de un cliente dentro de una campaña de preventa. */
@Entity
@Table(name = "preorder_customers")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
public class PreorderCustomer extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "preorder_id", nullable = false)
    private Preorder preorder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "deposit_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal depositAmount;

    @Column(length = 500)
    private String notes;
}

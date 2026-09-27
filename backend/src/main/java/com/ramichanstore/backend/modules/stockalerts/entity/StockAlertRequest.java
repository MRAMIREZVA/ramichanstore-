package com.ramichanstore.backend.modules.stockalerts.entity;

import com.ramichanstore.backend.common.base.BaseEntity;
import com.ramichanstore.backend.modules.products.entity.Product;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;

/**
 * "Avísame cuando esté disponible" (Fase 44) — un visitante del catálogo deja sus
 * datos en un producto agotado; extiende BaseEntity porque nace de un submit
 * público/anónimo (JpaAuditingConfig.auditorAware() cae a "system") y el admin
 * la actualiza (marca `notified`) igual que RespondComplaintRequest/OrderRequest.
 */
@Entity
@Table(name = "stock_alert_requests")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
public class StockAlertRequest extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "customer_name", nullable = false, length = 200)
    private String customerName;

    @Column(name = "customer_phone", nullable = false, length = 30)
    private String customerPhone;

    @Column(nullable = false)
    private boolean notified;

    @Column(name = "notified_at")
    private LocalDateTime notifiedAt;
}

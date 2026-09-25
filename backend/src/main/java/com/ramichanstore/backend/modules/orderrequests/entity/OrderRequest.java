package com.ramichanstore.backend.modules.orderrequests.entity;

import com.ramichanstore.backend.common.base.BaseEntity;
import com.ramichanstore.backend.modules.deliveryagencies.entity.DeliveryAgency;
import com.ramichanstore.backend.modules.sales.entity.DeliveryMethod;
import com.ramichanstore.backend.modules.sales.entity.PaymentMethod;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;

/**
 * Pedido enviado desde el carrito del catálogo público (sin login, Fase 18).
 * NO es una Venta real: nace en PENDING y solo pasa a afectar stock/puntos
 * cuando el admin la convierte explícitamente (ver OrderRequestService) —
 * evita que un visitante bloquee stock real con un pedido falso.
 */
@Entity
@Table(name = "order_requests")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
public class OrderRequest extends BaseEntity {

    @Column(name = "guest_name", nullable = false, length = 200)
    private String guestName;

    @Column(name = "guest_phone", nullable = false, length = 30)
    private String guestPhone;

    @Column(name = "guest_whatsapp", length = 30)
    private String guestWhatsapp;

    @Column(name = "guest_address", length = 255)
    private String guestAddress;

    @Column(name = "guest_district", length = 100)
    private String guestDistrict;

    @Column(name = "guest_province", length = 100)
    private String guestProvince;

    @Column(name = "guest_department", length = 100)
    private String guestDepartment;

    @Enumerated(EnumType.STRING)
    @Column(name = "preferred_payment_method", nullable = false, length = 20)
    private PaymentMethod preferredPaymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_method", nullable = false, length = 20)
    private DeliveryMethod deliveryMethod;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_agency_id")
    private DeliveryAgency deliveryAgency;

    /** Destinatario que recoge en la agencia — puede ser distinto de quien hace el pedido. */
    @Column(name = "recipient_dni", length = 20)
    private String recipientDni;

    @Column(name = "recipient_name", length = 200)
    private String recipientName;

    @Column(name = "recipient_phone", length = 30)
    private String recipientPhone;

    @Column(length = 500)
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrderRequestStatus status = OrderRequestStatus.PENDING;

    /** STOCK -> se convierte en Sale; PREORDER -> se convierte en reserva(s). Homogéneo: nunca mezcla ambos. */
    @Enumerated(EnumType.STRING)
    @Column(name = "request_type", nullable = false, length = 20)
    private OrderRequestType requestType = OrderRequestType.STOCK;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "converted_sale_id")
    private Long convertedSaleId;

    @OneToMany(mappedBy = "orderRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id")
    private List<OrderRequestItem> items = new ArrayList<>();
}

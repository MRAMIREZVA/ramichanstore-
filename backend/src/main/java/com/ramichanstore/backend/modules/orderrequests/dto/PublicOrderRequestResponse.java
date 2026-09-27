package com.ramichanstore.backend.modules.orderrequests.dto;

import com.ramichanstore.backend.modules.orderrequests.entity.OrderRequest;
import com.ramichanstore.backend.modules.orderrequests.entity.OrderRequestStatus;
import com.ramichanstore.backend.modules.orderrequests.entity.OrderRequestType;
import com.ramichanstore.backend.modules.sales.dto.SaleResponse;
import com.ramichanstore.backend.modules.sales.entity.DeliveryMethod;
import com.ramichanstore.backend.modules.sales.entity.PaymentMethod;
import com.ramichanstore.backend.modules.sales.entity.PaymentStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * "Buscar mi pedido" (Fase 47) — versión pública de {@link OrderRequestResponse} para un
 * visitante que compró sin cuenta: deliberadamente SIN dirección/distrito/DNI del
 * destinatario (no hace falta para ver un estado, y reduce lo que queda expuesto si alguien
 * adivinara un id+teléfono válidos). Si el pedido ya se convirtió en venta, se agregan
 * {@code saleOrderCode}/{@code salePaymentStatus} (reutilizando {@link SaleResponse}, sin
 * duplicar lógica) para que el cliente sepa si ya se registró el pago — el seguimiento de
 * ENTREGA queda fuera de esta primera versión a propósito (requeriría cruzar con el módulo
 * de Entregas, que agrupa por cliente-con-cuenta, no por pedido web individual).
 */
public record PublicOrderRequestResponse(
        Long id, OrderRequestType requestType, OrderRequestStatus status, String rejectionReason,
        List<OrderRequestItemResponse> items, BigDecimal total,
        PaymentMethod preferredPaymentMethod, DeliveryMethod deliveryMethod,
        LocalDateTime createdAt,
        Long convertedSaleId, String saleOrderCode, PaymentStatus salePaymentStatus) {

    public static PublicOrderRequestResponse from(OrderRequest o, SaleResponse sale) {
        List<OrderRequestItemResponse> items = o.getItems().stream().map(OrderRequestItemResponse::from).toList();
        BigDecimal total = items.stream().map(OrderRequestItemResponse::subtotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new PublicOrderRequestResponse(
                o.getId(), o.getRequestType(), o.getStatus(), o.getRejectionReason(),
                items, total,
                o.getPreferredPaymentMethod(), o.getDeliveryMethod(),
                o.getCreatedAt(),
                o.getConvertedSaleId(), sale != null ? sale.orderCode() : null, sale != null ? sale.paymentStatus() : null);
    }
}

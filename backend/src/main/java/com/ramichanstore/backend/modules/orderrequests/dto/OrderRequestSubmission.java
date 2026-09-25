package com.ramichanstore.backend.modules.orderrequests.dto;

import com.ramichanstore.backend.modules.sales.entity.DeliveryMethod;
import com.ramichanstore.backend.modules.sales.entity.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * Submit público (sin login) del carrito del catálogo — ver SecurityConfig,
 * POST /api/order-requests es la única ruta de este módulo sin @PreAuthorize.
 * Deliberadamente no acepta precios: OrderRequestService los toma del
 * Product real en el momento del submit.
 */
public record OrderRequestSubmission(
        @NotBlank(message = "El nombre es obligatorio") @Size(max = 200) String guestName,
        @NotBlank(message = "El teléfono es obligatorio") @Size(max = 30) String guestPhone,
        @Size(max = 30) String guestWhatsapp,
        @Size(max = 255) String guestAddress,
        @Size(max = 100) String guestDistrict,
        @Size(max = 100) String guestProvince,
        @Size(max = 100) String guestDepartment,
        @NotNull(message = "El método de pago preferido es obligatorio") PaymentMethod preferredPaymentMethod,
        @NotNull(message = "El método de entrega es obligatorio") DeliveryMethod deliveryMethod,
        Long deliveryAgencyId,
        @Size(max = 20) String recipientDni,
        @Size(max = 200) String recipientName,
        @Size(max = 30) String recipientPhone,
        @Size(max = 500) String notes,
        @NotEmpty(message = "El pedido debe tener al menos un producto") @Valid List<CartItemRequest> items) {
}

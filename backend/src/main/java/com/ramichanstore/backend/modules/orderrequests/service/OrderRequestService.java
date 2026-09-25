package com.ramichanstore.backend.modules.orderrequests.service;

import com.ramichanstore.backend.audit.AuditAction;
import com.ramichanstore.backend.audit.AuditService;
import com.ramichanstore.backend.common.exception.BusinessRuleException;
import com.ramichanstore.backend.common.exception.ResourceNotFoundException;
import com.ramichanstore.backend.modules.customers.dto.CustomerRequest;
import com.ramichanstore.backend.modules.customers.entity.CustomerStatus;
import com.ramichanstore.backend.modules.customers.repository.CustomerRepository;
import com.ramichanstore.backend.modules.customers.service.CustomerService;
import com.ramichanstore.backend.modules.deliveryagencies.service.DeliveryAgencyService;
import com.ramichanstore.backend.modules.orderrequests.dto.CartItemRequest;
import com.ramichanstore.backend.modules.orderrequests.dto.ConvertToReservationsRequest;
import com.ramichanstore.backend.modules.orderrequests.dto.OrderRequestResponse;
import com.ramichanstore.backend.modules.orderrequests.dto.OrderRequestSubmission;
import com.ramichanstore.backend.modules.orderrequests.entity.OrderRequest;
import com.ramichanstore.backend.modules.orderrequests.entity.OrderRequestItem;
import com.ramichanstore.backend.modules.orderrequests.entity.OrderRequestStatus;
import com.ramichanstore.backend.modules.orderrequests.entity.OrderRequestType;
import com.ramichanstore.backend.modules.orderrequests.repository.OrderRequestRepository;
import com.ramichanstore.backend.modules.preorders.dto.PreorderCustomerRequest;
import com.ramichanstore.backend.modules.preorders.entity.Preorder;
import com.ramichanstore.backend.modules.preorders.entity.PreorderStatus;
import com.ramichanstore.backend.modules.preorders.repository.PreorderRepository;
import com.ramichanstore.backend.modules.preorders.service.PreorderService;
import com.ramichanstore.backend.modules.products.entity.Product;
import com.ramichanstore.backend.modules.products.entity.ProductStatus;
import com.ramichanstore.backend.modules.products.service.ProductService;
import com.ramichanstore.backend.modules.sales.dto.SaleItemRequest;
import com.ramichanstore.backend.modules.sales.dto.SaleRequest;
import com.ramichanstore.backend.modules.sales.entity.PaymentStatus;
import com.ramichanstore.backend.modules.sales.service.SaleService;
import com.ramichanstore.backend.security.SecurityUser;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Pedidos enviados desde el carrito del catálogo público (Fase 18). `submit`
 * es la única operación que puede llamar un visitante anónimo — el resto
 * (buscar/convertir/rechazar) son de administración. Convertir un pedido web
 * arma un {@link SaleRequest} real y llama a {@link SaleService#create}, así
 * que la venta resultante queda con la misma validación de stock, descuento
 * de inventario, generación de puntos y auditoría que cualquier venta manual
 * — sin duplicar esa lógica acá.
 */
@Service
@RequiredArgsConstructor
public class OrderRequestService {

    private static final String MODULE = "ORDER_REQUESTS";

    private final OrderRequestRepository orderRequestRepository;
    private final ProductService productService;
    private final CustomerRepository customerRepository;
    private final CustomerService customerService;
    private final SaleService saleService;
    private final DeliveryAgencyService deliveryAgencyService;
    private final PreorderRepository preorderRepository;
    private final PreorderService preorderService;
    private final AuditService auditService;

    @Transactional
    public OrderRequestResponse submit(OrderRequestSubmission request) {
        OrderRequest orderRequest = new OrderRequest();
        orderRequest.setGuestName(request.guestName());
        orderRequest.setGuestPhone(request.guestPhone());
        orderRequest.setGuestWhatsapp(request.guestWhatsapp());
        orderRequest.setGuestAddress(request.guestAddress());
        orderRequest.setGuestDistrict(request.guestDistrict());
        orderRequest.setGuestProvince(request.guestProvince());
        orderRequest.setGuestDepartment(request.guestDepartment());
        orderRequest.setPreferredPaymentMethod(request.preferredPaymentMethod());
        orderRequest.setDeliveryMethod(request.deliveryMethod());
        if (request.deliveryAgencyId() != null) {
            orderRequest.setDeliveryAgency(deliveryAgencyService.findById(request.deliveryAgencyId()));
        }
        orderRequest.setRecipientDni(request.recipientDni());
        orderRequest.setRecipientName(request.recipientName());
        orderRequest.setRecipientPhone(request.recipientPhone());
        orderRequest.setNotes(request.notes());
        orderRequest.setStatus(OrderRequestStatus.PENDING);

        // Un pedido web es SIEMPRE homogéneo (todo STOCK o todo PREORDER) — el carrito público sí puede
        // mezclar ambos tipos (ver CartService.add en el frontend), pero el checkout los separa en 2
        // submits distintos antes de llegar acá. Esta es la validación de fondo, por si alguien llama
        // al endpoint público directo sin pasar por esa UI.
        OrderRequestType requestType = null;
        for (CartItemRequest cartItem : request.items()) {
            // findPublicById (no findById): un producto descontinuado no es comprable, ni por un pedido web.
            Product product = productService.findPublicById(cartItem.productId());
            boolean isPreorderItem = product.getStatus() == ProductStatus.PREORDER;
            OrderRequestType itemType = isPreorderItem ? OrderRequestType.PREORDER : OrderRequestType.STOCK;
            if (requestType == null) {
                requestType = itemType;
            } else if (requestType != itemType) {
                throw new BusinessRuleException("No se puede mezclar productos en preventa con productos en stock en el mismo pedido");
            }

            BigDecimal unitPrice = product.getSalePrice();
            OrderRequestItem item = new OrderRequestItem();
            item.setOrderRequest(orderRequest);
            item.setProduct(product);
            item.setQuantity(cartItem.quantity());
            item.setUnitPrice(unitPrice);
            item.setSubtotal(unitPrice.multiply(BigDecimal.valueOf(cartItem.quantity())));
            if (isPreorderItem) {
                // Snapshot de la campaña vigente — igual criterio que unitPrice: si la campaña cambia de
                // estado entre el submit y la conversión, el admin sigue viendo con cuál se comprometió el cliente.
                Preorder activeCampaign = preorderRepository
                        .findFirstByProductIdAndStatusOrderByCreatedAtDesc(product.getId(), PreorderStatus.ACTIVE)
                        .orElseThrow(() -> new BusinessRuleException(
                                "\"" + product.getName() + "\" ya no tiene una campaña de preventa activa — actualiza tu carrito"));
                item.setPreorder(activeCampaign);
            }
            orderRequest.getItems().add(item);
        }
        orderRequest.setRequestType(requestType != null ? requestType : OrderRequestType.STOCK);

        OrderRequest saved = orderRequestRepository.save(orderRequest);
        auditService.log(AuditAction.CREATE, MODULE, "OrderRequest", saved.getId().toString(), null, summarize(saved));
        return OrderRequestResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public Page<OrderRequestResponse> search(OrderRequestStatus status, Pageable pageable) {
        Page<OrderRequest> page = status != null
                ? orderRequestRepository.findByStatus(status, pageable)
                : orderRequestRepository.findAll(pageable);
        return page.map(OrderRequestResponse::from);
    }

    @Transactional(readOnly = true)
    public OrderRequestResponse findResponseById(Long id) {
        return OrderRequestResponse.from(findById(id));
    }

    @Transactional(readOnly = true)
    public OrderRequest findById(Long id) {
        return orderRequestRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Pedido web", id));
    }

    @Transactional
    public OrderRequestResponse reject(Long id, String reason) {
        OrderRequest orderRequest = findById(id);
        if (orderRequest.getStatus() != OrderRequestStatus.PENDING) {
            throw new BusinessRuleException("Solo se puede rechazar un pedido web pendiente");
        }
        orderRequest.setStatus(OrderRequestStatus.REJECTED);
        orderRequest.setRejectionReason(reason);
        OrderRequest saved = orderRequestRepository.save(orderRequest);
        auditService.log(AuditAction.UPDATE, MODULE, "OrderRequest", id.toString(), "PENDING", "REJECTED: " + reason);
        return OrderRequestResponse.from(saved);
    }

    @Transactional
    public OrderRequestResponse convertToSale(Long id, SecurityUser currentUser) {
        OrderRequest orderRequest = findById(id);
        if (orderRequest.getStatus() != OrderRequestStatus.PENDING) {
            throw new BusinessRuleException("Solo se puede convertir un pedido web pendiente");
        }
        if (orderRequest.getRequestType() != OrderRequestType.STOCK) {
            throw new BusinessRuleException("Este pedido es de preventa — conviértelo a reserva desde el botón correspondiente");
        }

        Long customerId = resolveCustomerId(orderRequest);

        var saleItems = orderRequest.getItems().stream()
                .map(item -> new SaleItemRequest(item.getProduct().getId(), item.getQuantity(), item.getUnitPrice(), BigDecimal.ZERO))
                .toList();
        String notes = "Convertido desde pedido web #" + orderRequest.getId()
                + (orderRequest.getNotes() != null && !orderRequest.getNotes().isBlank() ? " — " + orderRequest.getNotes() : "");
        SaleRequest saleRequest = new SaleRequest(
                customerId, LocalDate.now(), orderRequest.getPreferredPaymentMethod(), PaymentStatus.PENDING,
                orderRequest.getDeliveryMethod(), saleItems, notes);

        var sale = saleService.create(saleRequest, currentUser);

        orderRequest.setStatus(OrderRequestStatus.CONVERTED);
        orderRequest.setConvertedSaleId(sale.id());
        OrderRequest saved = orderRequestRepository.save(orderRequest);
        auditService.log(AuditAction.UPDATE, MODULE, "OrderRequest", id.toString(), "PENDING", "CONVERTED a Sale #" + sale.id());
        return OrderRequestResponse.from(saved);
    }

    /**
     * Convierte un pedido web de preventa en una o más reservas reales
     * ({@link PreorderCustomerRequest} vía {@link PreorderService#addReservation}) —
     * una por cada ítem, contra la campaña resuelta en {@link #submit}. A
     * diferencia de {@link #convertToSale}, acá el depósito NO se puede
     * inventar: es dinero real que el admin ya coordinó con el cliente, así
     * que lo declara explícitamente por ítem (ver {@link ConvertToReservationsRequest}).
     * Reutiliza toda la validación de cupos/depósito mínimo que ya tiene
     * {@code addReservation}, sin duplicarla acá.
     */
    @Transactional
    public OrderRequestResponse convertToReservations(Long id, ConvertToReservationsRequest request, SecurityUser currentUser) {
        OrderRequest orderRequest = findById(id);
        if (orderRequest.getStatus() != OrderRequestStatus.PENDING) {
            throw new BusinessRuleException("Solo se puede convertir un pedido web pendiente");
        }
        if (orderRequest.getRequestType() != OrderRequestType.PREORDER) {
            throw new BusinessRuleException("Este pedido no es de preventa — conviértelo a venta desde el botón correspondiente");
        }

        Map<Long, BigDecimal> depositByItemId = new HashMap<>();
        for (ConvertToReservationsRequest.ItemDeposit deposit : request.deposits()) {
            depositByItemId.put(deposit.itemId(), deposit.depositAmount());
        }

        Long customerId = resolveCustomerId(orderRequest);
        String notes = "Convertido desde pedido web #" + orderRequest.getId();

        for (OrderRequestItem item : orderRequest.getItems()) {
            BigDecimal depositAmount = depositByItemId.get(item.getId());
            if (depositAmount == null) {
                throw new BusinessRuleException(
                        "Falta el depósito de \"" + item.getProduct().getName() + "\" (ítem #" + item.getId() + ")");
            }
            if (item.getPreorder() == null) {
                // No debería pasar (submit siempre lo resuelve para un ítem PREORDER) — defensivo.
                throw new BusinessRuleException(
                        "\"" + item.getProduct().getName() + "\" no tiene una campaña de preventa asociada");
            }
            PreorderCustomerRequest reservationRequest = new PreorderCustomerRequest(
                    customerId, item.getQuantity(), depositAmount, orderRequest.getPreferredPaymentMethod(),
                    item.getUnitPrice(), notes);
            preorderService.addReservation(item.getPreorder().getId(), reservationRequest, currentUser);
        }

        orderRequest.setStatus(OrderRequestStatus.CONVERTED);
        OrderRequest saved = orderRequestRepository.save(orderRequest);
        auditService.log(AuditAction.UPDATE, MODULE, "OrderRequest", id.toString(), "PENDING",
                "CONVERTED a " + orderRequest.getItems().size() + " reserva(s) de preventa");
        return OrderRequestResponse.from(saved);
    }

    /** Si ya existe un cliente con ese teléfono lo reutiliza; si no, crea uno nuevo con los datos del pedido web. */
    private Long resolveCustomerId(OrderRequest orderRequest) {
        return customerRepository.findByPhoneIgnoreCase(orderRequest.getGuestPhone())
                .map(customer -> customer.getId())
                .orElseGet(() -> {
                    CustomerRequest customerRequest = new CustomerRequest(
                            orderRequest.getGuestName(), null, null, orderRequest.getGuestPhone(),
                            orderRequest.getGuestWhatsapp(), null, orderRequest.getGuestDistrict(), orderRequest.getGuestAddress(),
                            CustomerStatus.ACTIVE, "Cliente creado automáticamente desde el pedido web #" + orderRequest.getId());
                    return customerService.create(customerRequest).id();
                });
    }

    private String summarize(OrderRequest orderRequest) {
        return "cliente=%s, tel=%s, items=%d, pago=%s, entrega=%s".formatted(
                orderRequest.getGuestName(), orderRequest.getGuestPhone(), orderRequest.getItems().size(),
                orderRequest.getPreferredPaymentMethod(), orderRequest.getDeliveryMethod());
    }
}

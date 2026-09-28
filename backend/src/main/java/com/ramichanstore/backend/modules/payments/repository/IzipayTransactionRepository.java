package com.ramichanstore.backend.modules.payments.repository;

import com.ramichanstore.backend.modules.payments.entity.IzipayTransaction;
import com.ramichanstore.backend.modules.payments.entity.IzipayTransactionStatus;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IzipayTransactionRepository extends JpaRepository<IzipayTransaction, Long> {

    /**
     * La IPN llega con el `orderId` que nosotros mismos enviamos al crear el formToken — buscamos
     * la transacción PENDING más reciente para ese orderId (un reintento del cliente puede haber
     * generado más de una fila con el mismo izipayOrderId si se reutiliza por order_request_id).
     */
    Optional<IzipayTransaction> findTopByIzipayOrderIdAndStatusOrderByCreatedAtDesc(
            String izipayOrderId, IzipayTransactionStatus status);

    /**
     * Último intento de pago en línea de un pedido web, para que el admin vea en "Pedidos web" si
     * ese pedido llegó pagado o solo enviado (Fase 53). Se ordena por fecha porque un cliente puede
     * reintentar el pago y dejar varias filas para el mismo pedido.
     */
    Optional<IzipayTransaction> findTopByOrderRequestIdOrderByCreatedAtDesc(Long orderRequestId);
}

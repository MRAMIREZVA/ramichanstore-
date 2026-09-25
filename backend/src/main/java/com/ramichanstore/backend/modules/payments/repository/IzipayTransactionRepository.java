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
}

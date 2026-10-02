package com.ramichanstore.backend.modules.sales.repository;

import com.ramichanstore.backend.modules.sales.entity.PaymentMethod;
import com.ramichanstore.backend.modules.sales.entity.PaymentStatus;
import com.ramichanstore.backend.modules.sales.entity.Sale;
import com.ramichanstore.backend.modules.sales.entity.SaleType;
import java.time.LocalDate;
import org.springframework.data.jpa.domain.Specification;

/** Filtros dinámicos del listado de ventas: cliente, tipo, estado/método de pago, rango de fechas. */
public final class SaleSpecifications {

    private SaleSpecifications() {
    }

    public static Specification<Sale> hasType(SaleType type) {
        if (type == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("type"), type);
    }

    public static Specification<Sale> hasCustomer(Long customerId) {
        if (customerId == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("customer").get("id"), customerId);
    }

    public static Specification<Sale> hasPaymentStatus(PaymentStatus status) {
        if (status == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("paymentStatus"), status);
    }

    public static Specification<Sale> hasPaymentMethod(PaymentMethod method) {
        if (method == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("paymentMethod"), method);
    }

    public static Specification<Sale> saleDateFrom(LocalDate from) {
        if (from == null) {
            return null;
        }
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("saleDate"), from);
    }

    public static Specification<Sale> saleDateTo(LocalDate to) {
        if (to == null) {
            return null;
        }
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("saleDate"), to);
    }

    /**
     * "Clientes que me deben": PENDING/PARTIAL implican saldo &gt; 0 por invariante del propio
     * paymentStatus (nunca se recalcula acá un balanceDue aparte, que es un valor derivado del
     * ledger de abonos, no una columna — ver SaleResponse.from). CANCELLED se excluye a propósito:
     * una venta cancelada no es una cuenta por cobrar real, sin importar qué muestre su total.
     */
    public static Specification<Sale> withPendingBalance(Boolean onlyPending) {
        if (onlyPending == null || !onlyPending) {
            return null;
        }
        return (root, query, cb) -> root.get("paymentStatus").in(PaymentStatus.PENDING, PaymentStatus.PARTIAL);
    }
}

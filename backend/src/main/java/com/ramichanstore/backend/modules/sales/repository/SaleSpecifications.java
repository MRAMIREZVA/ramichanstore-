package com.ramichanstore.backend.modules.sales.repository;

import com.ramichanstore.backend.modules.sales.entity.PaymentMethod;
import com.ramichanstore.backend.modules.sales.entity.PaymentStatus;
import com.ramichanstore.backend.modules.sales.entity.Sale;
import java.time.LocalDate;
import org.springframework.data.jpa.domain.Specification;

/** Filtros dinámicos del listado de ventas: cliente, estado/método de pago, rango de fechas. */
public final class SaleSpecifications {

    private SaleSpecifications() {
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
}

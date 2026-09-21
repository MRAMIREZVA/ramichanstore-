package com.ramichanstore.backend.modules.separations.dto;

import com.ramichanstore.backend.modules.products.entity.Product;
import com.ramichanstore.backend.modules.products.entity.ProductImage;
import com.ramichanstore.backend.modules.sales.entity.PaymentStatus;
import com.ramichanstore.backend.modules.separations.entity.Separation;
import java.math.BigDecimal;
import java.time.LocalDate;

public record SeparationResponse(
        Long id,
        Long customerId, String customerName, String customerPhone, String customerWhatsapp,
        Long productId, String productSku, String productName, String productMainImageUrl,
        int quantity, BigDecimal totalPrice, BigDecimal amountPaid, BigDecimal balanceDue,
        LocalDate separationDate, LocalDate limitDate,
        PaymentStatus status, boolean overdue, String notes) {

    public static SeparationResponse from(Separation s, BigDecimal amountPaid) {
        BigDecimal balanceDue = s.getTotalPrice().subtract(amountPaid).max(BigDecimal.ZERO);
        boolean overdue = (s.getStatus() == PaymentStatus.PENDING || s.getStatus() == PaymentStatus.PARTIAL)
                && s.getLimitDate().isBefore(LocalDate.now());
        var product = s.getProduct();
        return new SeparationResponse(
                s.getId(),
                s.getCustomer().getId(), s.getCustomer().getFullName(), s.getCustomer().getPhone(), s.getCustomer().getWhatsapp(),
                product.getId(), product.getSku(), product.getName(), mainImageUrl(product),
                s.getQuantity(), s.getTotalPrice(), amountPaid, balanceDue,
                s.getSeparationDate(), s.getLimitDate(),
                s.getStatus(), overdue, s.getNotes());
    }

    private static String mainImageUrl(Product product) {
        return product.getImages().stream()
                .filter(ProductImage::isMain)
                .map(img -> "/api/products/images/" + img.getId() + "/file")
                .findFirst()
                .orElse(product.getMainImageUrl());
    }
}

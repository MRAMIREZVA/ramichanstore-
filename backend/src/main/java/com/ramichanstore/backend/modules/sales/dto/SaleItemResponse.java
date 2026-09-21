package com.ramichanstore.backend.modules.sales.dto;

import com.ramichanstore.backend.modules.products.entity.Product;
import com.ramichanstore.backend.modules.products.entity.ProductImage;
import com.ramichanstore.backend.modules.sales.entity.SaleDetail;
import java.math.BigDecimal;

public record SaleItemResponse(
        Long id, Long productId, String productSku, String productName, String productMainImageUrl,
        int quantity, BigDecimal unitPrice, BigDecimal discount, BigDecimal unitCost, BigDecimal subtotal) {

    public static SaleItemResponse from(SaleDetail d) {
        Product product = d.getProduct();
        return new SaleItemResponse(
                d.getId(), product.getId(), product.getSku(), product.getName(), mainImageUrl(product),
                d.getQuantity(), d.getUnitPrice(), d.getDiscount(), d.getUnitCost(), d.getSubtotal());
    }

    /** Mismo criterio que PreorderCustomerResponse: imagen marcada principal, o el mainImageUrl legacy si no hay ninguna. */
    private static String mainImageUrl(Product product) {
        return product.getImages().stream()
                .filter(ProductImage::isMain)
                .map(img -> "/api/products/images/" + img.getId() + "/file")
                .findFirst()
                .orElse(product.getMainImageUrl());
    }
}

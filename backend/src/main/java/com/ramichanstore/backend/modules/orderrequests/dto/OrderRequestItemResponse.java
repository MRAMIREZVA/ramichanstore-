package com.ramichanstore.backend.modules.orderrequests.dto;

import com.ramichanstore.backend.modules.orderrequests.entity.OrderRequestItem;
import com.ramichanstore.backend.modules.products.entity.Product;
import com.ramichanstore.backend.modules.products.entity.ProductImage;
import java.math.BigDecimal;

public record OrderRequestItemResponse(
        Long id, Long productId, String productSku, String productName, String productMainImageUrl,
        int quantity, BigDecimal unitPrice, BigDecimal subtotal,
        Long preorderId, BigDecimal suggestedDeposit) {

    public static OrderRequestItemResponse from(OrderRequestItem item) {
        Product product = item.getProduct();
        var preorder = item.getPreorder();
        BigDecimal suggestedDeposit = preorder != null
                ? preorder.getMinDepositAmount().multiply(BigDecimal.valueOf(item.getQuantity()))
                : null;
        return new OrderRequestItemResponse(
                item.getId(), product.getId(), product.getSku(), product.getName(), mainImageUrl(product),
                item.getQuantity(), item.getUnitPrice(), item.getSubtotal(),
                preorder != null ? preorder.getId() : null, suggestedDeposit);
    }

    private static String mainImageUrl(Product product) {
        return product.getImages().stream()
                .filter(ProductImage::isMain)
                .map(img -> "/api/products/images/" + img.getId() + "/file")
                .findFirst()
                .orElse(product.getMainImageUrl());
    }
}

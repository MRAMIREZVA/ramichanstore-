package com.ramichanstore.backend.modules.shipments.dto;

import com.ramichanstore.backend.modules.shipments.entity.ShipmentItem;
import java.math.BigDecimal;

public record ShipmentItemResponse(
        Long id, String articleCode, String description, int quantity,
        BigDecimal weight, BigDecimal cost, BigDecimal commission, BigDecimal transactionSurcharge,
        String imageUrl, boolean pending) {

    public static ShipmentItemResponse from(ShipmentItem item) {
        String imageUrl = item.getImageData() != null ? "/api/shipments/items/" + item.getId() + "/image/file" : null;
        return new ShipmentItemResponse(
                item.getId(), item.getArticleCode(), item.getDescription(), item.getQuantity(),
                item.getWeight(), item.getCost(), item.getCommission(), item.getTransactionSurcharge(),
                imageUrl, item.getShipment() == null);
    }
}

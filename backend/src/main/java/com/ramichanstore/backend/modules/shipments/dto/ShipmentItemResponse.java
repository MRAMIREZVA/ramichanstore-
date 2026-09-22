package com.ramichanstore.backend.modules.shipments.dto;

import com.ramichanstore.backend.modules.shipments.entity.ShipmentItem;

public record ShipmentItemResponse(Long id, String articleCode, String description, int quantity, String imageUrl) {
    public static ShipmentItemResponse from(ShipmentItem item) {
        String imageUrl = item.getImageData() != null ? "/api/shipments/items/" + item.getId() + "/image/file" : null;
        return new ShipmentItemResponse(item.getId(), item.getArticleCode(), item.getDescription(), item.getQuantity(), imageUrl);
    }
}

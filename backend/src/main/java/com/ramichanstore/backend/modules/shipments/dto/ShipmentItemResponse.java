package com.ramichanstore.backend.modules.shipments.dto;

import com.ramichanstore.backend.modules.shipments.entity.ShipmentItem;

public record ShipmentItemResponse(Long id, String articleCode, String description, int quantity) {
    public static ShipmentItemResponse from(ShipmentItem item) {
        return new ShipmentItemResponse(item.getId(), item.getArticleCode(), item.getDescription(), item.getQuantity());
    }
}

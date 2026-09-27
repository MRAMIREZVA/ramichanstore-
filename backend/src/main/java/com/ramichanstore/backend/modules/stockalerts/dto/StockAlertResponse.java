package com.ramichanstore.backend.modules.stockalerts.dto;

import com.ramichanstore.backend.modules.stockalerts.entity.StockAlertRequest;
import java.time.LocalDateTime;

public record StockAlertResponse(
        Long id, Long productId, String customerName, String customerPhone,
        boolean notified, LocalDateTime notifiedAt, LocalDateTime createdAt) {

    public static StockAlertResponse from(StockAlertRequest a) {
        return new StockAlertResponse(
                a.getId(), a.getProduct().getId(), a.getCustomerName(), a.getCustomerPhone(),
                a.isNotified(), a.getNotifiedAt(), a.getCreatedAt());
    }
}

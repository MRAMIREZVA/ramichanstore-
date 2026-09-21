package com.ramichanstore.backend.modules.reports.dto;

import java.math.BigDecimal;

public record TopProductPoint(Long productId, String productName, long quantitySold, BigDecimal revenue) {
}

package com.ramichanstore.backend.modules.reports.dto;

import java.math.BigDecimal;

public record TopCategoryPoint(Long categoryId, String categoryName, BigDecimal revenue) {
}

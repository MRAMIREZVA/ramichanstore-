package com.ramichanstore.backend.modules.reports.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DailySalesPoint(LocalDate date, BigDecimal sales, BigDecimal profit) {
}

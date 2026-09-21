package com.ramichanstore.backend.modules.reports.dto;

import java.time.LocalDate;

public record CustomerGrowthPoint(LocalDate date, long newCustomers) {
}

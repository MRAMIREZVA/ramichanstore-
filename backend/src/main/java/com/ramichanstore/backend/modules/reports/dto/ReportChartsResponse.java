package com.ramichanstore.backend.modules.reports.dto;

import java.util.List;

public record ReportChartsResponse(
        List<DailySalesPoint> dailySales,
        List<TopProductPoint> topProducts,
        List<TopCategoryPoint> topCategories,
        List<CustomerGrowthPoint> customerGrowth) {
}

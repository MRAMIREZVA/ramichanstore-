package com.ramichanstore.backend.modules.reports.controller;

import com.ramichanstore.backend.common.dto.ApiResponse;
import com.ramichanstore.backend.modules.reports.dto.DashboardSummaryResponse;
import com.ramichanstore.backend.modules.reports.dto.ReportChartsResponse;
import com.ramichanstore.backend.modules.reports.service.ReportService;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasAuthority('PERM_DASHBOARD_VIEW')")
    public ApiResponse<DashboardSummaryResponse> dashboard() {
        return ApiResponse.ok(reportService.getDashboardSummary());
    }

    @GetMapping("/charts")
    @PreAuthorize("hasAuthority('PERM_REPORTS_VIEW')")
    public ApiResponse<ReportChartsResponse> charts(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        LocalDate effectiveTo = to != null ? to : LocalDate.now();
        LocalDate effectiveFrom = from != null ? from : effectiveTo.with(TemporalAdjusters.firstDayOfMonth());
        return ApiResponse.ok(reportService.getCharts(effectiveFrom, effectiveTo));
    }
}

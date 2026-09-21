package com.ramichanstore.backend.modules.reports.controller;

import com.ramichanstore.backend.common.dto.ApiResponse;
import com.ramichanstore.backend.common.exception.BusinessRuleException;
import com.ramichanstore.backend.modules.reports.dto.DashboardSummaryResponse;
import com.ramichanstore.backend.modules.reports.dto.ReportChartsResponse;
import com.ramichanstore.backend.modules.reports.dto.ReportExportData;
import com.ramichanstore.backend.modules.reports.export.ReportExportService;
import com.ramichanstore.backend.modules.reports.service.ReportService;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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
    private final ReportExportService reportExportService;

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

    @GetMapping("/export")
    @PreAuthorize("hasAuthority('PERM_REPORTS_VIEW')")
    public ResponseEntity<byte[]> export(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam String format) {
        LocalDate effectiveTo = to != null ? to : LocalDate.now();
        LocalDate effectiveFrom = from != null ? from : effectiveTo.with(TemporalAdjusters.firstDayOfMonth());
        ReportExportData data = reportService.getExportData(effectiveFrom, effectiveTo);
        String filenameBase = "reporte-ventas_%s_%s".formatted(effectiveFrom, effectiveTo);

        byte[] body;
        MediaType mediaType;
        String extension;
        switch (format.toLowerCase()) {
            case "xlsx" -> {
                body = reportExportService.toExcel(data);
                mediaType = MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                extension = "xlsx";
            }
            case "csv" -> {
                body = reportExportService.toCsv(data);
                mediaType = MediaType.parseMediaType("text/csv");
                extension = "csv";
            }
            case "pdf" -> {
                body = reportExportService.toPdf(data);
                mediaType = MediaType.APPLICATION_PDF;
                extension = "pdf";
            }
            default -> throw new BusinessRuleException("Formato de exportación no soportado: " + format);
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(filenameBase + "." + extension).build().toString())
                .body(body);
    }
}

package com.ramichanstore.backend.modules.reports.export;

import com.ramichanstore.backend.modules.reports.dto.DailySalesPoint;
import com.ramichanstore.backend.modules.reports.dto.ReportExportData;
import com.ramichanstore.backend.modules.reports.dto.SaleExportRow;
import com.ramichanstore.backend.modules.reports.dto.TopCategoryPoint;
import com.ramichanstore.backend.modules.reports.dto.TopProductPoint;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.StringWriter;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFFont;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

/**
 * Escribe un {@link ReportExportData} (ya calculado por ReportService, esta clase
 * no calcula nada) en el formato pedido. CSV exporta solo "Ventas detalladas"
 * porque es la única sección que es naturalmente una tabla plana homogénea;
 * Excel arma un libro con una hoja por sección; PDF arma un resumen ejecutivo
 * imprimible (sin el detalle fila-por-fila, que puede ser muy largo para PDF).
 */
@Service
public class ReportExportService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public byte[] toExcel(ReportExportData data) {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            CellStyle headerStyle = headerStyle(workbook);
            CellStyle currencyStyle = currencyStyle(workbook);

            writeSummarySheet(workbook, data, headerStyle, currencyStyle);
            writeSalesSheet(workbook, data, headerStyle, currencyStyle);
            writeDailySheet(workbook, data, headerStyle, currencyStyle);
            writeTopProductsSheet(workbook, data, headerStyle, currencyStyle);
            writeTopCategoriesSheet(workbook, data, headerStyle, currencyStyle);

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo generar el Excel del reporte", e);
        }
    }

    /** Solo "Ventas detalladas" — es la única sección con forma de tabla plana homogénea. */
    public byte[] toCsv(ReportExportData data) {
        StringWriter writer = new StringWriter();
        CSVFormat format = CSVFormat.DEFAULT.builder()
                .setHeader("Código", "Fecha", "Cliente", "Total", "Ganancia", "Estado")
                .build();
        try (CSVPrinter printer = new CSVPrinter(writer, format)) {
            for (SaleExportRow row : data.sales()) {
                printer.printRecord(
                        row.orderCode(), row.saleDate(), row.customerName(),
                        row.total().toPlainString(), row.profit().toPlainString(), row.paymentStatus());
            }
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo generar el CSV del reporte", e);
        }
        return writer.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    public byte[] toPdf(ReportExportData data) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 36, 36, 54, 36);
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
            Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA, 11, Font.ITALIC);
            Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13);

            document.add(new Paragraph(data.storeName() + " — Reporte de ventas", titleFont));
            document.add(new Paragraph(
                    "Del " + data.from().format(DATE_FMT) + " al " + data.to().format(DATE_FMT), subtitleFont));
            document.add(spacer());

            document.add(new Paragraph("Resumen", sectionFont));
            document.add(summaryTable(data));
            document.add(spacer());

            document.add(new Paragraph("Top productos", sectionFont));
            document.add(topProductsTable(data.topProducts()));
            document.add(spacer());

            document.add(new Paragraph("Top categorías", sectionFont));
            document.add(topCategoriesTable(data.topCategories()));
            document.add(spacer());

            document.add(new Paragraph("Ventas por día", sectionFont));
            document.add(dailySalesTable(data.dailySales()));

            document.close();
            return out.toByteArray();
        } catch (DocumentException e) {
            throw new IllegalStateException("No se pudo generar el PDF del reporte", e);
        }
    }

    private static Paragraph spacer() {
        return new Paragraph(" ");
    }

    private PdfPTable summaryTable(ReportExportData data) {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(60);
        addRow(table, "Total de ventas", money(data.totalSales()));
        addRow(table, "Ganancia total", money(data.totalProfit()));
        addRow(table, "Cantidad de ventas", String.valueOf(data.salesCount()));
        addRow(table, "Ticket promedio", money(data.averageTicket()));
        return table;
    }

    private PdfPTable topProductsTable(List<TopProductPoint> products) {
        PdfPTable table = new PdfPTable(3);
        table.setWidthPercentage(100);
        addHeaderRow(table, "Producto", "Cantidad vendida", "Ingresos");
        for (TopProductPoint p : products) {
            table.addCell(cell(p.productName()));
            table.addCell(cell(String.valueOf(p.quantitySold())));
            table.addCell(cell(money(p.revenue())));
        }
        if (products.isEmpty()) {
            emptyRow(table, 3);
        }
        return table;
    }

    private PdfPTable topCategoriesTable(List<TopCategoryPoint> categories) {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        addHeaderRow(table, "Categoría", "Ingresos");
        for (TopCategoryPoint c : categories) {
            table.addCell(cell(c.categoryName()));
            table.addCell(cell(money(c.revenue())));
        }
        if (categories.isEmpty()) {
            emptyRow(table, 2);
        }
        return table;
    }

    private PdfPTable dailySalesTable(List<DailySalesPoint> days) {
        PdfPTable table = new PdfPTable(3);
        table.setWidthPercentage(100);
        addHeaderRow(table, "Fecha", "Ventas", "Ganancia");
        for (DailySalesPoint d : days) {
            table.addCell(cell(d.date().format(DATE_FMT)));
            table.addCell(cell(money(d.sales())));
            table.addCell(cell(money(d.profit())));
        }
        if (days.isEmpty()) {
            emptyRow(table, 3);
        }
        return table;
    }

    private void addRow(PdfPTable table, String label, String value) {
        table.addCell(cell(label));
        table.addCell(cell(value));
    }

    private void addHeaderRow(PdfPTable table, String... headers) {
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Paragraph(h, headerFont));
            cell.setBackgroundColor(new java.awt.Color(237, 231, 246));
            table.addCell(cell);
        }
    }

    private void emptyRow(PdfPTable table, int span) {
        PdfPCell cell = new PdfPCell(new Paragraph("Sin datos en el período"));
        cell.setColspan(span);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(cell);
    }

    private PdfPCell cell(String text) {
        return new PdfPCell(new Paragraph(text, FontFactory.getFont(FontFactory.HELVETICA, 10)));
    }

    private String money(BigDecimal amount) {
        return "S/ " + amount.setScale(2, java.math.RoundingMode.HALF_UP);
    }

    private void writeSummarySheet(XSSFWorkbook workbook, ReportExportData data, CellStyle headerStyle, CellStyle currencyStyle) {
        Sheet sheet = workbook.createSheet("Resumen");
        int r = 0;
        writeKeyValue(sheet, r++, "Tienda", data.storeName(), null);
        writeKeyValue(sheet, r++, "Período", data.from() + " a " + data.to(), null);
        writeKeyValue(sheet, r++, "Total de ventas", data.totalSales().doubleValue(), currencyStyle);
        writeKeyValue(sheet, r++, "Ganancia total", data.totalProfit().doubleValue(), currencyStyle);
        writeKeyValue(sheet, r++, "Cantidad de ventas", data.salesCount(), null);
        writeKeyValue(sheet, r, "Ticket promedio", data.averageTicket().doubleValue(), currencyStyle);
        sheet.setColumnWidth(0, 6000);
        sheet.setColumnWidth(1, 5000);
    }

    private void writeKeyValue(Sheet sheet, int rowIndex, String label, Object value, CellStyle valueStyle) {
        Row row = sheet.createRow(rowIndex);
        row.createCell(0).setCellValue(label);
        Cell valueCell = row.createCell(1);
        if (value instanceof Double d) {
            valueCell.setCellValue(d);
        } else if (value instanceof Long l) {
            valueCell.setCellValue(l);
        } else {
            valueCell.setCellValue(String.valueOf(value));
        }
        if (valueStyle != null) {
            valueCell.setCellStyle(valueStyle);
        }
    }

    private void writeSalesSheet(XSSFWorkbook workbook, ReportExportData data, CellStyle headerStyle, CellStyle currencyStyle) {
        Sheet sheet = workbook.createSheet("Ventas detalladas");
        writeHeader(sheet, headerStyle, "Código", "Fecha", "Cliente", "Total", "Ganancia", "Estado");
        int r = 1;
        for (SaleExportRow s : data.sales()) {
            Row row = sheet.createRow(r++);
            row.createCell(0).setCellValue(s.orderCode());
            row.createCell(1).setCellValue(s.saleDate().toString());
            row.createCell(2).setCellValue(s.customerName());
            setCurrency(row.createCell(3), s.total().doubleValue(), currencyStyle);
            setCurrency(row.createCell(4), s.profit().doubleValue(), currencyStyle);
            row.createCell(5).setCellValue(s.paymentStatus());
        }
        autoSizeColumns(sheet, 6);
    }

    private void writeDailySheet(XSSFWorkbook workbook, ReportExportData data, CellStyle headerStyle, CellStyle currencyStyle) {
        Sheet sheet = workbook.createSheet("Ventas por dia");
        writeHeader(sheet, headerStyle, "Fecha", "Ventas", "Ganancia");
        int r = 1;
        for (DailySalesPoint d : data.dailySales()) {
            Row row = sheet.createRow(r++);
            row.createCell(0).setCellValue(d.date().toString());
            setCurrency(row.createCell(1), d.sales().doubleValue(), currencyStyle);
            setCurrency(row.createCell(2), d.profit().doubleValue(), currencyStyle);
        }
        autoSizeColumns(sheet, 3);
    }

    private void writeTopProductsSheet(XSSFWorkbook workbook, ReportExportData data, CellStyle headerStyle, CellStyle currencyStyle) {
        Sheet sheet = workbook.createSheet("Top productos");
        writeHeader(sheet, headerStyle, "Producto", "Cantidad vendida", "Ingresos");
        int r = 1;
        for (TopProductPoint p : data.topProducts()) {
            Row row = sheet.createRow(r++);
            row.createCell(0).setCellValue(p.productName());
            row.createCell(1).setCellValue(p.quantitySold());
            setCurrency(row.createCell(2), p.revenue().doubleValue(), currencyStyle);
        }
        autoSizeColumns(sheet, 3);
    }

    private void writeTopCategoriesSheet(XSSFWorkbook workbook, ReportExportData data, CellStyle headerStyle, CellStyle currencyStyle) {
        Sheet sheet = workbook.createSheet("Top categorias");
        writeHeader(sheet, headerStyle, "Categoría", "Ingresos");
        int r = 1;
        for (TopCategoryPoint c : data.topCategories()) {
            Row row = sheet.createRow(r++);
            row.createCell(0).setCellValue(c.categoryName());
            setCurrency(row.createCell(1), c.revenue().doubleValue(), currencyStyle);
        }
        autoSizeColumns(sheet, 2);
    }

    private void writeHeader(Sheet sheet, CellStyle headerStyle, String... headers) {
        Row row = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = row.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }
    }

    private void setCurrency(Cell cell, double value, CellStyle currencyStyle) {
        cell.setCellValue(value);
        cell.setCellStyle(currencyStyle);
    }

    private void autoSizeColumns(Sheet sheet, int columnCount) {
        for (int i = 0; i < columnCount; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    private CellStyle headerStyle(XSSFWorkbook workbook) {
        XSSFCellStyle style = workbook.createCellStyle();
        XSSFFont font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.VIOLET.getIndex());
        style.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
        return style;
    }

    private CellStyle currencyStyle(XSSFWorkbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setDataFormat(workbook.createDataFormat().getFormat("#,##0.00"));
        return style;
    }
}

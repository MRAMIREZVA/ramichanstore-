package com.ramichanstore.backend.modules.reports.service;

import com.ramichanstore.backend.modules.customers.repository.CustomerRepository;
import com.ramichanstore.backend.modules.loyalty.repository.LoyaltyPointMovementRepository;
import com.ramichanstore.backend.modules.preorders.entity.PreorderStatus;
import com.ramichanstore.backend.modules.preorders.repository.PreorderRepository;
import com.ramichanstore.backend.modules.products.repository.ProductRepository;
import com.ramichanstore.backend.modules.reports.dto.CustomerGrowthPoint;
import com.ramichanstore.backend.modules.reports.dto.DailySalesPoint;
import com.ramichanstore.backend.modules.reports.dto.DashboardSummaryResponse;
import com.ramichanstore.backend.modules.reports.dto.ReportChartsResponse;
import com.ramichanstore.backend.modules.reports.dto.TopCategoryPoint;
import com.ramichanstore.backend.modules.reports.dto.TopProductPoint;
import com.ramichanstore.backend.modules.sales.entity.PaymentStatus;
import com.ramichanstore.backend.modules.sales.repository.SaleDetailRepository;
import com.ramichanstore.backend.modules.sales.repository.SaleRepository;
import com.ramichanstore.backend.modules.separations.entity.Separation;
import com.ramichanstore.backend.modules.separations.repository.PaymentRepository;
import com.ramichanstore.backend.modules.separations.repository.SeparationRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Solo lectura: agrega datos de Ventas/Productos/Preventas/Clientes/Puntos/
 * Separaciones para el dashboard y la pantalla de Reportes. No modifica nada.
 */
@Service
@RequiredArgsConstructor
public class ReportService {

    private final SaleRepository saleRepository;
    private final SaleDetailRepository saleDetailRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final PreorderRepository preorderRepository;
    private final SeparationRepository separationRepository;
    private final PaymentRepository paymentRepository;
    private final LoyaltyPointMovementRepository loyaltyPointMovementRepository;

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getDashboardSummary() {
        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.with(TemporalAdjusters.firstDayOfMonth());

        List<Separation> pendingSeparations = separationRepository.findByStatusIn(List.of(PaymentStatus.PENDING, PaymentStatus.PARTIAL));
        BigDecimal pendingBalance = pendingSeparations.stream()
                .map(s -> s.getTotalPrice().subtract(paymentRepository.sumPaidAmount(s.getId())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new DashboardSummaryResponse(
                saleRepository.sumTotalBetween(today, today), saleRepository.countBetween(today, today),
                saleRepository.sumTotalBetween(monthStart, today), saleRepository.countBetween(monthStart, today),
                saleRepository.sumProfitBetween(monthStart, today),
                productRepository.count(), productRepository.findLowStock().size(),
                preorderRepository.countByStatus(PreorderStatus.ACTIVE), preorderRepository.countByStatus(PreorderStatus.COMING_SOON),
                customerRepository.count(),
                loyaltyPointMovementRepository.sumPositivePointsBetween(monthStart.atStartOfDay(), LocalDateTime.of(today, LocalTime.MAX)),
                pendingSeparations.size(), pendingBalance);
    }

    @Transactional(readOnly = true)
    public ReportChartsResponse getCharts(LocalDate from, LocalDate to) {
        List<DailySalesPoint> dailySales = saleRepository.dailyTotalsBetween(from, to).stream()
                .map(row -> new DailySalesPoint((LocalDate) row[0], (BigDecimal) row[1], (BigDecimal) row[2]))
                .toList();

        List<TopProductPoint> topProducts = saleDetailRepository.topProductsBetween(from, to, PageRequest.of(0, 8)).stream()
                .map(row -> new TopProductPoint((Long) row[0], (String) row[1], (Long) row[2], (BigDecimal) row[3]))
                .toList();

        List<TopCategoryPoint> topCategories = saleDetailRepository.topCategoriesBetween(from, to, PageRequest.of(0, 8)).stream()
                .map(row -> new TopCategoryPoint((Long) row[0], (String) row[1], (BigDecimal) row[2]))
                .toList();

        List<CustomerGrowthPoint> customerGrowth = groupCustomersByDay(from, to);

        return new ReportChartsResponse(dailySales, topProducts, topCategories, customerGrowth);
    }

    private List<CustomerGrowthPoint> groupCustomersByDay(LocalDate from, LocalDate to) {
        Map<LocalDate, Long> counts = customerRepository
                .findByCreatedAtBetween(from.atStartOfDay(), LocalDateTime.of(to, LocalTime.MAX)).stream()
                .collect(Collectors.groupingBy(c -> c.getCreatedAt().toLocalDate(), Collectors.counting()));
        return counts.entrySet().stream()
                .map(e -> new CustomerGrowthPoint(e.getKey(), e.getValue()))
                .sorted(Comparator.comparing(CustomerGrowthPoint::date))
                .toList();
    }
}

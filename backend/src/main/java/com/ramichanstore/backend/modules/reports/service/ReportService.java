package com.ramichanstore.backend.modules.reports.service;

import com.ramichanstore.backend.modules.analytics.entity.CatalogEventType;
import com.ramichanstore.backend.modules.analytics.repository.CatalogPageViewRepository;
import com.ramichanstore.backend.modules.customers.entity.Customer;
import com.ramichanstore.backend.modules.customers.repository.CustomerRepository;
import com.ramichanstore.backend.modules.deliveries.entity.DeliveryStatus;
import com.ramichanstore.backend.modules.deliveries.repository.DeliveryRepository;
import com.ramichanstore.backend.modules.loyalty.repository.LoyaltyPointMovementRepository;
import com.ramichanstore.backend.modules.orderrequests.entity.OrderRequestStatus;
import com.ramichanstore.backend.modules.orderrequests.repository.OrderRequestRepository;
import com.ramichanstore.backend.modules.preorders.entity.Preorder;
import com.ramichanstore.backend.modules.preorders.entity.PreorderCustomer;
import com.ramichanstore.backend.modules.preorders.entity.PreorderStatus;
import com.ramichanstore.backend.modules.preorders.repository.PreorderCustomerPaymentRepository;
import com.ramichanstore.backend.modules.preorders.repository.PreorderCustomerRepository;
import com.ramichanstore.backend.modules.preorders.repository.PreorderRepository;
import com.ramichanstore.backend.modules.products.entity.Product;
import com.ramichanstore.backend.modules.products.repository.ProductRepository;
import com.ramichanstore.backend.modules.reports.dto.CatalogVisitsSummary;
import com.ramichanstore.backend.modules.reports.dto.CustomerActivePreorderResponse;
import com.ramichanstore.backend.modules.reports.dto.CustomerDebtResponse;
import com.ramichanstore.backend.modules.reports.dto.CustomerGrowthPoint;
import com.ramichanstore.backend.modules.reports.dto.DailyReservationsPoint;
import com.ramichanstore.backend.modules.reports.dto.DailySalesPoint;
import com.ramichanstore.backend.modules.reports.dto.DashboardSummaryResponse;
import com.ramichanstore.backend.modules.reports.dto.InventoryValuationResponse;
import com.ramichanstore.backend.modules.reports.dto.PreorderReservationsSummary;
import com.ramichanstore.backend.modules.reports.dto.ReceivablesReportResponse;
import com.ramichanstore.backend.modules.reports.dto.ReportChartsResponse;
import com.ramichanstore.backend.modules.reports.dto.ReportExportData;
import com.ramichanstore.backend.modules.reports.dto.SaleExportRow;
import com.ramichanstore.backend.modules.reports.dto.TopCategoryPoint;
import com.ramichanstore.backend.modules.reports.dto.TopProductPoint;
import com.ramichanstore.backend.modules.reports.dto.TopReservedProductPoint;
import com.ramichanstore.backend.modules.reports.dto.TopViewedProductPoint;
import com.ramichanstore.backend.modules.sales.entity.PaymentStatus;
import com.ramichanstore.backend.modules.sales.entity.Sale;
import com.ramichanstore.backend.modules.sales.entity.SaleType;
import com.ramichanstore.backend.modules.sales.repository.PaymentRepository;
import com.ramichanstore.backend.modules.sales.repository.SaleDetailRepository;
import com.ramichanstore.backend.modules.sales.repository.SaleRepository;
import com.ramichanstore.backend.modules.sales.repository.SaleSpecifications;
import com.ramichanstore.backend.modules.settings.service.SettingService;
import com.ramichanstore.backend.modules.shipments.entity.ShipmentStatus;
import com.ramichanstore.backend.modules.shipments.repository.ShipmentRepository;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
    private final PaymentRepository paymentRepository;
    private final PreorderCustomerRepository preorderCustomerRepository;
    private final PreorderCustomerPaymentRepository preorderCustomerPaymentRepository;
    private final LoyaltyPointMovementRepository loyaltyPointMovementRepository;
    private final SettingService settingService;
    private final CatalogPageViewRepository catalogPageViewRepository;
    private final DeliveryRepository deliveryRepository;
    private final OrderRequestRepository orderRequestRepository;
    private final ShipmentRepository shipmentRepository;

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getDashboardSummary() {
        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.with(TemporalAdjusters.firstDayOfMonth());

        List<Sale> pendingSeparations = saleRepository.findByTypeAndPaymentStatusIn(SaleType.SEPARACION, List.of(PaymentStatus.PENDING, PaymentStatus.PARTIAL));
        BigDecimal pendingBalance = pendingSeparations.stream()
                .map(s -> s.getTotal().subtract(paymentRepository.sumPaidAmount(s.getId())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new DashboardSummaryResponse(
                saleRepository.sumTotalBetween(today, today), saleRepository.countBetween(today, today),
                saleRepository.sumTotalBetween(monthStart, today), saleRepository.countBetween(monthStart, today),
                saleRepository.sumProfitBetween(monthStart, today),
                productRepository.count(), productRepository.findLowStock().size(),
                preorderRepository.countByStatus(PreorderStatus.ACTIVE), preorderRepository.countByStatus(PreorderStatus.COMING_SOON),
                customerRepository.count(),
                loyaltyPointMovementRepository.sumPositivePointsBetween(monthStart.atStartOfDay(), LocalDateTime.of(today, LocalTime.MAX)),
                pendingSeparations.size(), pendingBalance,
                lateDeliveriesCount(today), overduePreordersCount(today), pendingWebOrdersCount(), customsFlaggedShipmentsCount());
    }

    /**
     * Entregas que ya debieron salir/llegar (fecha programada pasada) pero siguen sin un estado
     * final — mismo criterio de "atrasada" sin importar cuánto tiempo pasó, ya que Delivery no
     * distingue "un día tarde" de "un mes tarde" en ningún otro lugar del sistema.
     */
    private long lateDeliveriesCount(LocalDate today) {
        if (!hasAuthority("PERM_DELIVERY_VIEW")) return 0;
        return deliveryRepository.countByStatusInAndScheduledDateBefore(
                List.of(DeliveryStatus.PENDING, DeliveryStatus.PREPARING, DeliveryStatus.READY, DeliveryStatus.SHIPPED), today);
    }

    /** Campañas de preventa cuya fecha límite ya pasó pero que no se entregaron ni cancelaron — mismo criterio exacto de "abierta" que getReceivables(). */
    private long overduePreordersCount(LocalDate today) {
        if (!hasAuthority("PERM_PREORDER_VIEW")) return 0;
        return preorderRepository.countByStatusNotInAndLimitDateBefore(
                List.of(PreorderStatus.DELIVERED, PreorderStatus.CANCELLED), today);
    }

    private long pendingWebOrdersCount() {
        if (!hasAuthority("PERM_ORDER_REQUEST_VIEW")) return 0;
        return orderRequestRepository.countByStatus(OrderRequestStatus.PENDING);
    }

    private long customsFlaggedShipmentsCount() {
        if (!hasAuthority("PERM_SHIPMENT_VIEW")) return 0;
        return shipmentRepository.countByStatus(ShipmentStatus.OBSERVADO_ADUANAS);
    }

    /**
     * El Dashboard es accesible con un solo permiso (PERM_DASHBOARD_VIEW, ej. VENDEDOR desde Fase
     * 75) pero cada alerta expone datos de un módulo distinto — sin este chequeo, un rol sin acceso
     * a Embarques/Preventas/etc. vería de todos modos un conteo de ese módulo en su propio
     * dashboard, aunque el resto del sistema ya le oculte esa pantalla (sidebar Y rutas, Fase 75).
     */
    private boolean hasAuthority(String code) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals(code));
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

        LocalDateTime fromDateTime = from.atStartOfDay();
        LocalDateTime toDateTime = LocalDateTime.of(to, LocalTime.MAX);
        CatalogVisitsSummary catalogVisits = new CatalogVisitsSummary(
                catalogPageViewRepository.countByEventTypeAndCreatedAtBetween(CatalogEventType.CATALOG_HOME, fromDateTime, toDateTime),
                catalogPageViewRepository.countDistinctVisitorsBetween(CatalogEventType.CATALOG_HOME, fromDateTime, toDateTime));
        List<TopViewedProductPoint> topViewedProducts = catalogPageViewRepository
                .topViewedProductsBetween(fromDateTime, toDateTime, PageRequest.of(0, 8)).stream()
                .map(row -> new TopViewedProductPoint((Long) row[0], (String) row[1], (Long) row[2]))
                .toList();

        List<PreorderCustomer> reservations = preorderCustomerRepository.findByCreatedAtBetween(fromDateTime, toDateTime);
        PreorderReservationsSummary preorderReservations = new PreorderReservationsSummary(
                reservations.size(), preorderCustomerPaymentRepository.sumAmountBetween(fromDateTime, toDateTime));
        List<DailyReservationsPoint> dailyReservations = groupReservationsByDay(reservations);
        List<TopReservedProductPoint> topReservedProducts = topReservedProducts(reservations);

        return new ReportChartsResponse(dailySales, topProducts, topCategories, customerGrowth, catalogVisits, topViewedProducts,
                preorderReservations, dailyReservations, topReservedProducts);
    }

    /** Todo lo necesario para el reporte exportable (Excel/PDF/CSV) — mismos totales/tops que {@link #getCharts}, más el detalle de ventas. */
    @Transactional(readOnly = true)
    public ReportExportData getExportData(LocalDate from, LocalDate to) {
        ReportChartsResponse charts = getCharts(from, to);

        BigDecimal totalSales = saleRepository.sumTotalBetween(from, to);
        BigDecimal totalProfit = saleRepository.sumProfitBetween(from, to);
        long salesCount = saleRepository.countBetween(from, to);
        BigDecimal averageTicket = salesCount > 0
                ? totalSales.divide(BigDecimal.valueOf(salesCount), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        List<Specification<Sale>> specs = List.of(
                SaleSpecifications.hasType(SaleType.VENTA), SaleSpecifications.saleDateFrom(from), SaleSpecifications.saleDateTo(to));
        List<SaleExportRow> sales = saleRepository
                .findAll(Specification.allOf(specs.stream().filter(Objects::nonNull).toList()), Sort.by("saleDate"))
                .stream()
                .map(s -> new SaleExportRow(
                        "V-%06d".formatted(s.getId()), s.getSaleDate(),
                        s.getCustomer() != null ? s.getCustomer().getFullName() : "Sin cliente",
                        s.getTotal(), s.getProfit(), s.getPaymentStatus().name()))
                .toList();

        return new ReportExportData(
                settingService.getValue("STORE_NAME"), from, to,
                totalSales, totalProfit, salesCount, averageTicket,
                sales, charts.dailySales(), charts.topProducts(), charts.topCategories());
    }

    /**
     * "Cuentas por cobrar": junta el saldo pendiente de un cliente en Ventas (PENDING/PARTIAL — sin
     * ledger propio, cuenta el total completo, mismo criterio ya usado en el portal para estos casos),
     * Separaciones (total - SUM(payments), mismo patrón que {@link #getDashboardSummary}) y reservas de
     * preventa activas (total - SUM(payments)), y de paso arma la lista de "quién tiene preventas activas"
     * (campaña ni DELIVERED ni CANCELLED). Una reserva huérfana (preventa/producto ya borrado, ver lección
     * de Fase 37) se omite en silencio en vez de romper el reporte completo.
     */
    @Transactional(readOnly = true)
    public ReceivablesReportResponse getReceivables() {
        Map<Long, CustomerDebtResponse> debtByCustomer = new LinkedHashMap<>();

        for (Sale sale : saleRepository.findByPaymentStatusInAndCustomerIsNotNull(List.of(PaymentStatus.PENDING, PaymentStatus.PARTIAL))) {
            if (sale.getType() == SaleType.VENTA) {
                accumulateDebt(debtByCustomer, sale.getCustomer(), sale.getTotal(), BigDecimal.ZERO, BigDecimal.ZERO);
            } else {
                BigDecimal balance = sale.getTotal().subtract(paymentRepository.sumPaidAmount(sale.getId()));
                if (balance.compareTo(BigDecimal.ZERO) > 0) {
                    accumulateDebt(debtByCustomer, sale.getCustomer(), BigDecimal.ZERO, balance, BigDecimal.ZERO);
                }
            }
        }

        List<CustomerActivePreorderResponse> activePreorders = new ArrayList<>();
        for (PreorderCustomer reservation : preorderCustomerRepository.findAll()) {
            try {
                Preorder preorder = reservation.getPreorder();
                PreorderStatus status = preorder.getStatus();
                if (status == PreorderStatus.DELIVERED || status == PreorderStatus.CANCELLED) continue;

                Customer customer = reservation.getCustomer();
                Product product = preorder.getProduct();
                BigDecimal totalPrice = reservation.getUnitPrice().multiply(BigDecimal.valueOf(reservation.getQuantity()));
                BigDecimal paid = preorderCustomerPaymentRepository.sumPaidAmount(reservation.getId());
                BigDecimal balance = totalPrice.subtract(paid);

                activePreorders.add(new CustomerActivePreorderResponse(
                        customer.getId(), customer.getFullName(), customer.getPhone(), customer.getWhatsapp(),
                        reservation.getId(), product.getSku(), product.getName(), reservation.getQuantity(),
                        totalPrice, paid, balance, status.name(), preorder.getEstimatedArrivalDate()));

                if (balance.compareTo(BigDecimal.ZERO) > 0) {
                    accumulateDebt(debtByCustomer, customer, BigDecimal.ZERO, BigDecimal.ZERO, balance);
                }
            } catch (EntityNotFoundException ex) {
                // Reserva huérfana (preventa o producto ya borrado) — se omite, no rompe el reporte.
            }
        }

        List<CustomerDebtResponse> customersWithDebt = debtByCustomer.values().stream()
                .sorted(Comparator.comparing(CustomerDebtResponse::totalBalance).reversed())
                .toList();
        List<CustomerActivePreorderResponse> sortedActivePreorders = activePreorders.stream()
                .sorted(Comparator.comparing(CustomerActivePreorderResponse::customerName))
                .toList();

        return new ReceivablesReportResponse(customersWithDebt, sortedActivePreorders);
    }

    /**
     * Snapshot de "cuánto vale mi stock" — igual que {@link #getReceivables()}, sin rango de
     * fechas, siempre "ahora mismo". {@code stockValueAtCost} queda subestimado por cada producto
     * con costo en S/0 (import masivo sin precio de compra real cargado) — por eso el DTO expone
     * {@code productsWithoutCost} junto al total, para que el admin sepa que el número no es 100%
     * confiable hasta que corrija esos productos (ver filtro "withoutCost" en ProductController).
     */
    @Transactional(readOnly = true)
    public InventoryValuationResponse getInventoryValuation() {
        BigDecimal valueAtCost = productRepository.sumStockValueAtCost();
        BigDecimal valueAtSalePrice = productRepository.sumStockValueAtSalePrice();
        return new InventoryValuationResponse(
                valueAtCost, valueAtSalePrice, valueAtSalePrice.subtract(valueAtCost),
                productRepository.count(), productRepository.countByTotalCost(BigDecimal.ZERO));
    }

    private void accumulateDebt(
            Map<Long, CustomerDebtResponse> debtByCustomer, Customer customer,
            BigDecimal salesDelta, BigDecimal separationsDelta, BigDecimal preordersDelta) {
        if (customer == null) return;
        CustomerDebtResponse existing = debtByCustomer.get(customer.getId());
        BigDecimal sales = (existing != null ? existing.salesBalance() : BigDecimal.ZERO).add(salesDelta);
        BigDecimal separations = (existing != null ? existing.separationsBalance() : BigDecimal.ZERO).add(separationsDelta);
        BigDecimal preorders = (existing != null ? existing.preordersBalance() : BigDecimal.ZERO).add(preordersDelta);
        debtByCustomer.put(customer.getId(), new CustomerDebtResponse(
                customer.getId(), customer.getFullName(), customer.getPhone(), customer.getWhatsapp(),
                sales, separations, preorders, sales.add(separations).add(preorders)));
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

    /** Gráficas de preventa (Fase 67) — deliberadamente separadas de Ventas, ver PreorderReservationsSummary. */
    private List<DailyReservationsPoint> groupReservationsByDay(List<PreorderCustomer> reservations) {
        Map<LocalDate, Long> counts = reservations.stream()
                .collect(Collectors.groupingBy(pc -> pc.getCreatedAt().toLocalDate(), Collectors.counting()));
        return counts.entrySet().stream()
                .map(e -> new DailyReservationsPoint(e.getKey(), e.getValue()))
                .sorted(Comparator.comparing(DailyReservationsPoint::date))
                .toList();
    }

    /**
     * Agrupado en Java a partir de la misma lista ya cargada por groupReservationsByDay (sin una
     * segunda consulta) — un record local como clave de agrupación evita depender de la identidad
     * de la entidad Product como clave de Map. Una reserva huérfana (campaña ya borrada, ver
     * lección de Fase 37) se omite en silencio en vez de romper el reporte completo — mismo
     * patrón defensivo ya usado en getReceivables().
     */
    private List<TopReservedProductPoint> topReservedProducts(List<PreorderCustomer> reservations) {
        record Key(Long productId, String productName) {
        }
        Map<Key, Long> byProduct = new LinkedHashMap<>();
        for (PreorderCustomer pc : reservations) {
            try {
                Product product = pc.getPreorder().getProduct();
                byProduct.merge(new Key(product.getId(), product.getName()), (long) pc.getQuantity(), Long::sum);
            } catch (EntityNotFoundException ex) {
                // Reserva huérfana (campaña ya borrada) — se omite, no rompe el reporte.
            }
        }
        return byProduct.entrySet().stream()
                .sorted(Map.Entry.<Key, Long>comparingByValue().reversed())
                .limit(8)
                .map(e -> new TopReservedProductPoint(e.getKey().productId(), e.getKey().productName(), e.getValue()))
                .toList();
    }
}

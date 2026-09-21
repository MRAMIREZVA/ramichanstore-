package com.ramichanstore.backend.modules.portal.service;

import com.ramichanstore.backend.common.exception.ResourceNotFoundException;
import com.ramichanstore.backend.modules.deliveries.dto.DeliveryResponse;
import com.ramichanstore.backend.modules.deliveries.service.DeliveryService;
import com.ramichanstore.backend.modules.loyalty.dto.LoyaltyBalanceResponse;
import com.ramichanstore.backend.modules.loyalty.service.LoyaltyService;
import com.ramichanstore.backend.modules.portal.dto.PortalReservationResponse;
import com.ramichanstore.backend.modules.preorders.repository.PreorderCustomerRepository;
import com.ramichanstore.backend.modules.sales.dto.SaleResponse;
import com.ramichanstore.backend.modules.sales.service.SaleService;
import com.ramichanstore.backend.modules.separations.dto.SeparationResponse;
import com.ramichanstore.backend.modules.separations.service.SeparationService;
import jakarta.persistence.EntityNotFoundException;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Solo lectura, siempre acotado al {@code customerId} del cliente autenticado
 * (nunca recibido del cliente/request — se pasa explícitamente desde el
 * controller a partir del JWT). Reutiliza los servicios de dominio existentes
 * (SaleService, LoyaltyService, DeliveryService) tal como anticipaba la
 * arquitectura desde Fase 0 — ningún servicio de dominio tuvo que cambiar para esto.
 */
@Service
@RequiredArgsConstructor
public class PortalService {

    private final SaleService saleService;
    private final SeparationService separationService;
    private final LoyaltyService loyaltyService;
    private final DeliveryService deliveryService;
    private final PreorderCustomerRepository preorderCustomerRepository;

    @Transactional(readOnly = true)
    public Page<SaleResponse> mySales(Long customerId, Pageable pageable) {
        return saleService.search(customerId, null, null, null, null, pageable);
    }

    /**
     * Separación (Fase 6) = producto ya en stock reservado en abonos, tan
     * "compra" del cliente como una venta — antes {@code mySales} era la
     * única fuente de "Mis compras" en el portal y un cliente cuya única
     * compra fue una separación (ej. Mauricio, ver CLAUDE.md Fase 17) no veía
     * nada. El frontend une esta lista con {@code mySales} igual que ya hacía
     * el admin en customer-detail.ts.
     */
    @Transactional(readOnly = true)
    public Page<SeparationResponse> mySeparations(Long customerId, Pageable pageable) {
        return separationService.search(customerId, null, null, null, pageable);
    }

    @Transactional(readOnly = true)
    public SaleResponse mySale(Long customerId, Long saleId) {
        SaleResponse sale = saleService.findResponseById(saleId);
        if (sale.customerId() == null || !sale.customerId().equals(customerId)) {
            throw ResourceNotFoundException.of("Venta", saleId);
        }
        return sale;
    }

    @Transactional(readOnly = true)
    public List<PortalReservationResponse> myReservations(Long customerId) {
        List<PortalReservationResponse> reservations = new ArrayList<>();
        for (var pc : preorderCustomerRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)) {
            try {
                reservations.add(PortalReservationResponse.from(pc));
            } catch (EntityNotFoundException ignored) {
                // defensivo: una reserva cuya preventa fue eliminada antes de que PreorderService.delete
                // validara esto (ver esa clase) queda huérfana — se omite en vez de romper la pantalla del cliente.
            }
        }
        return reservations;
    }

    @Transactional(readOnly = true)
    public LoyaltyBalanceResponse myLoyaltyBalance(Long customerId) {
        return loyaltyService.getBalance(customerId);
    }

    /**
     * Sin paginar a propósito: el frontend cruza {@code items} de cada entrega
     * (por tipo+id, ver DeliveryItemResponse) con "mis compras" (ventas y
     * separaciones) para mostrar el estado de entrega de cada una. Desde
     * Fase 17 una entrega agrupa varias compras del cliente, ya no es 1:1
     * con una venta — ver CLAUDE.md.
     */
    @Transactional(readOnly = true)
    public List<DeliveryResponse> myDeliveries(Long customerId) {
        return deliveryService.search(customerId, null, Pageable.unpaged()).getContent();
    }
}

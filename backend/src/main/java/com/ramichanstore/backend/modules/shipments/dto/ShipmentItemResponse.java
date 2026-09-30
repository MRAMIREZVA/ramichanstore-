package com.ramichanstore.backend.modules.shipments.dto;

import com.ramichanstore.backend.modules.shipments.entity.Shipment;
import com.ramichanstore.backend.modules.shipments.entity.ShipmentItem;
import com.ramichanstore.backend.modules.shipments.entity.ShipmentStatus;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;

public record ShipmentItemResponse(
        Long id, String articleCode, String description, int quantity,
        BigDecimal weight, BigDecimal cost, BigDecimal commission, BigDecimal transactionSurcharge,
        String imageUrl, boolean pending,
        Long shipmentId, String shipmentCode, ShipmentStatus shipmentStatus) {

    /**
     * shipmentId/shipmentCode/shipmentStatus solo van llenos cuando el artículo YA
     * está asignado (pending=false) — permiten que la pantalla de "Artículos
     * comprados" (Fase 40) muestre el estado real del embarque en vez de solo
     * Pendiente/No pendiente (Fase 69). item.getShipment() es LAZY, pero acá es
     * seguro: from() siempre corre dentro del @Transactional del service, y
     * cuando se llama desde ShipmentResponse.from() el shipment ya es el mismo
     * agregado raíz ya cargado (sin query extra).
     *
     * Bug real encontrado en Fase 69: un embarque eliminado (soft-delete) deja
     * artículos huérfanos apuntando a un shipment_id que @SQLRestriction ya
     * filtra — acceder a sus propiedades lanza EntityNotFoundException (mismo
     * patrón ya documentado en ReportService/PreorderService/PortalService).
     * A diferencia de esos casos, ACÁ no se omite la fila entera (el artículo
     * en sí sigue siendo información real y útil), solo se degrada a
     * "Pendiente" — el embarque al que apuntaba ya no existe, así que para
     * cualquier propósito práctico es como si no estuviera asignado.
     */
    public static ShipmentItemResponse from(ShipmentItem item) {
        String imageUrl = item.getImageData() != null ? "/api/shipments/items/" + item.getId() + "/image/file" : null;
        Long shipmentId = null;
        String shipmentCode = null;
        ShipmentStatus shipmentStatus = null;
        boolean pending = true;
        try {
            Shipment shipment = item.getShipment();
            if (shipment != null) {
                // Los 3 reads deben completar juntos antes de tocar las variables de
                // salida — si getCode()/getStatus() lanzan a mitad de camino, "pending"
                // NO debe quedar en false con shipmentCode/Status todavía en null.
                Long resolvedId = shipment.getId();
                String resolvedCode = shipment.getCode();
                ShipmentStatus resolvedStatus = shipment.getStatus();
                pending = false;
                shipmentId = resolvedId;
                shipmentCode = resolvedCode;
                shipmentStatus = resolvedStatus;
            }
        } catch (EntityNotFoundException ignored) {
            // Embarque padre ya eliminado — se trata como artículo pendiente.
            pending = true;
            shipmentId = null;
            shipmentCode = null;
            shipmentStatus = null;
        }
        return new ShipmentItemResponse(
                item.getId(), item.getArticleCode(), item.getDescription(), item.getQuantity(),
                item.getWeight(), item.getCost(), item.getCommission(), item.getTransactionSurcharge(),
                imageUrl, pending, shipmentId, shipmentCode, shipmentStatus);
    }
}

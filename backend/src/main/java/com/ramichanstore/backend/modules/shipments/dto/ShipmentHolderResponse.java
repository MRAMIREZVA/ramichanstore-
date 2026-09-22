package com.ramichanstore.backend.modules.shipments.dto;

import com.ramichanstore.backend.modules.shipments.entity.ShipmentHolder;

public record ShipmentHolderResponse(Long id, String name, String zenAccount, String notes) {
    public static ShipmentHolderResponse from(ShipmentHolder holder) {
        return new ShipmentHolderResponse(holder.getId(), holder.getName(), holder.getZenAccount(), holder.getNotes());
    }
}

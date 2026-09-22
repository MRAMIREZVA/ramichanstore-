package com.ramichanstore.backend.modules.shipments.dto;

import com.ramichanstore.backend.modules.shipments.entity.ShipmentTypeOption;

public record ShipmentTypeOptionResponse(Long id, String name, String notes) {
    public static ShipmentTypeOptionResponse from(ShipmentTypeOption option) {
        return new ShipmentTypeOptionResponse(option.getId(), option.getName(), option.getNotes());
    }
}

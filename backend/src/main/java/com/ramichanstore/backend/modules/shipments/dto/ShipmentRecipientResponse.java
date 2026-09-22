package com.ramichanstore.backend.modules.shipments.dto;

import com.ramichanstore.backend.modules.shipments.entity.ShipmentRecipient;

public record ShipmentRecipientResponse(Long id, String name, String notes) {
    public static ShipmentRecipientResponse from(ShipmentRecipient recipient) {
        return new ShipmentRecipientResponse(recipient.getId(), recipient.getName(), recipient.getNotes());
    }
}

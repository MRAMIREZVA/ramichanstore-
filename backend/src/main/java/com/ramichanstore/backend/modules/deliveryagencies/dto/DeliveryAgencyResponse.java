package com.ramichanstore.backend.modules.deliveryagencies.dto;

import com.ramichanstore.backend.modules.deliveryagencies.entity.DeliveryAgency;

public record DeliveryAgencyResponse(Long id, String name) {

    public static DeliveryAgencyResponse from(DeliveryAgency agency) {
        return new DeliveryAgencyResponse(agency.getId(), agency.getName());
    }
}

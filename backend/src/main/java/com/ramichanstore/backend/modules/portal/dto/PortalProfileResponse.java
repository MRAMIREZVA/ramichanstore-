package com.ramichanstore.backend.modules.portal.dto;

import com.ramichanstore.backend.modules.customers.entity.Customer;

public record PortalProfileResponse(Long id, String fullName, String documentNumber, String phone, String email) {
    public static PortalProfileResponse from(Customer c) {
        return new PortalProfileResponse(c.getId(), c.getFullName(), c.getDocumentNumber(), c.getPhone(), c.getEmail());
    }
}

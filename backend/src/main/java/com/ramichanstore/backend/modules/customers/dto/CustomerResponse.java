package com.ramichanstore.backend.modules.customers.dto;

import com.ramichanstore.backend.modules.customers.entity.Customer;
import com.ramichanstore.backend.modules.customers.entity.CustomerStatus;
import com.ramichanstore.backend.modules.customers.entity.DocumentType;
import java.time.LocalDateTime;

public record CustomerResponse(
        Long id, String fullName,
        DocumentType documentType, String documentNumber,
        String phone, String whatsapp, String email,
        String district, String address,
        CustomerStatus status, String notes,
        LocalDateTime registeredAt,
        boolean portalEnabled, String portalUsername) {

    public static CustomerResponse from(Customer c) {
        return new CustomerResponse(
                c.getId(), c.getFullName(),
                c.getDocumentType(), c.getDocumentNumber(),
                c.getPhone(), c.getWhatsapp(), c.getEmail(),
                c.getDistrict(), c.getAddress(),
                c.getStatus(), c.getNotes(),
                c.getCreatedAt(),
                c.isPortalEnabled(), c.getPortalUsername());
    }
}

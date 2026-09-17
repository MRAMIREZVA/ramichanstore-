package com.ramichanstore.backend.modules.suppliers.dto;

import com.ramichanstore.backend.modules.suppliers.entity.Supplier;

public record SupplierResponse(
        Long id, String name, String company, String phone, String whatsapp,
        String email, String country, String address, String notes) {
    public static SupplierResponse from(Supplier supplier) {
        return new SupplierResponse(
                supplier.getId(), supplier.getName(), supplier.getCompany(), supplier.getPhone(),
                supplier.getWhatsapp(), supplier.getEmail(), supplier.getCountry(),
                supplier.getAddress(), supplier.getNotes());
    }
}

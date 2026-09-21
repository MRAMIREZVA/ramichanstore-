package com.ramichanstore.backend.modules.loyalty.dto;

public record LoyaltyBalanceResponse(Long customerId, String customerName, int balance) {
}

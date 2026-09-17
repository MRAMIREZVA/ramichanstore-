package com.ramichanstore.backend.common.exception;

/** Se lanza cuando una operación viola una regla de negocio (ej. stock insuficiente, cupos agotados). */
public class BusinessRuleException extends RuntimeException {
    public BusinessRuleException(String message) {
        super(message);
    }
}

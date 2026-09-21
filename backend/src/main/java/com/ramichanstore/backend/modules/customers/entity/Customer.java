package com.ramichanstore.backend.modules.customers.entity;

import com.ramichanstore.backend.common.base.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;

/**
 * Ficha básica del cliente. El historial de compras/preventas/pagos/puntos NO
 * se guarda aquí como contadores: se calcula desde las tablas de esos módulos
 * (Fases 4-7) para evitar que un contador desincronizado mienta sobre el saldo real.
 */
@Entity
@Table(name = "customers")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
public class Customer extends BaseEntity {

    @Column(name = "full_name", nullable = false, length = 200)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", length = 20)
    private DocumentType documentType;

    @Column(name = "document_number", length = 20)
    private String documentNumber;

    @Column(nullable = false, length = 30)
    private String phone;

    @Column(length = 30)
    private String whatsapp;

    @Column(length = 150)
    private String email;

    @Column(length = 100)
    private String district;

    @Column(length = 255)
    private String address;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CustomerStatus status = CustomerStatus.ACTIVE;

    @Column(length = 500)
    private String notes;

    /** Credenciales del portal de clientes (solo lectura) — independientes de `users`. Ver V13. */
    @Column(name = "portal_username", length = 50)
    private String portalUsername;

    @Column(name = "portal_password_hash", length = 255)
    private String portalPasswordHash;

    @Column(name = "portal_enabled", nullable = false)
    private boolean portalEnabled = false;
}

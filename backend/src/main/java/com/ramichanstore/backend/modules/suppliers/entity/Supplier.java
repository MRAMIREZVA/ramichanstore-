package com.ramichanstore.backend.modules.suppliers.entity;

import com.ramichanstore.backend.common.base.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "suppliers")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
public class Supplier extends BaseEntity {

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 150)
    private String company;

    @Column(length = 30)
    private String phone;

    @Column(length = 30)
    private String whatsapp;

    @Column(length = 150)
    private String email;

    @Column(length = 80)
    private String country;

    @Column(length = 255)
    private String address;

    @Column(length = 500)
    private String notes;
}

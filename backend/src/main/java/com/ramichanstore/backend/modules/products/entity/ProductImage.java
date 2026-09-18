package com.ramichanstore.backend.modules.products.entity;

import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Imagen de producto guardada como binario en la base de datos (no como URL externa),
 * para poder servirla directamente y usarla más adelante en el catálogo público.
 * Cada producto puede tener varias; como máximo una con isMain = true.
 */
@Entity
@Table(name = "product_images")
@Getter
@Setter
@NoArgsConstructor
public class ProductImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "content_type", length = 100)
    private String contentType;

    @Lob
    @Basic(fetch = FetchType.LAZY)
    @Column(name = "image_data")
    private byte[] imageData;

    @Column(name = "is_main", nullable = false)
    private boolean main;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}

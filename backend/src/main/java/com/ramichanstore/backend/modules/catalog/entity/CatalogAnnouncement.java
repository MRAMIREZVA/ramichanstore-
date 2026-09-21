package com.ramichanstore.backend.modules.catalog.entity;

import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Imagen del panel flotante de bienvenida del catálogo público, binario en BD
 * (mismo criterio que {@code CatalogBanner}/{@code ProductImage} — ver sección
 * 6.1 de CLAUDE.md). Tabla "singleton": a lo más una fila, con id fijo
 * {@link com.ramichanstore.backend.modules.catalog.service.CatalogService#ANNOUNCEMENT_ID}.
 */
@Entity
@Table(name = "catalog_announcement")
@Getter
@Setter
@NoArgsConstructor
public class CatalogAnnouncement {

    @Id
    private Long id;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "content_type", nullable = false, length = 50)
    private String contentType;

    @Lob
    @Basic(fetch = FetchType.LAZY)
    @Column(name = "image_data", nullable = false)
    private byte[] imageData;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "updated_by")
    private String updatedBy;
}

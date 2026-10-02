package com.ramichanstore.backend.modules.products.dto;

/**
 * Proyección de {@code ProductImage} SIN {@code imageData} (Fase 78) — para listados que
 * necesitan los metadatos de imagen de MUCHOS productos a la vez (catálogo público agrupado,
 * listado admin). {@code @Basic(fetch = LAZY)} en {@code ProductImage.imageData} no tiene
 * efecto real sin bytecode enhancement (no configurado en este proyecto): navegar
 * {@code product.getImages()} para muchos productos a la vez trae el binario COMPLETO de
 * cada imagen aunque nunca se use (confirmado con trace SQL real: una página de 560
 * productos tardaba 5+ segundos incluso contra localhost, por el peso de ese binario, no
 * por cantidad de queries). Esta proyección evita el problema de raíz seleccionando
 * explícitamente solo lo que {@code ProductImageResponse} realmente usa.
 */
public interface ProductImageSummary {
    Long getId();

    Long getProductId();

    String getFileName();

    boolean isMain();

    int getSortOrder();
}

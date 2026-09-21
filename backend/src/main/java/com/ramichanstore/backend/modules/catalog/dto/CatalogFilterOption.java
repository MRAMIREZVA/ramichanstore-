package com.ramichanstore.backend.modules.catalog.dto;

/** Opción de filtro pública (categoría/marca): solo id + nombre, nada más. */
public record CatalogFilterOption(Long id, String name) {
}

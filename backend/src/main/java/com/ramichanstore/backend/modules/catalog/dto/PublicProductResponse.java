package com.ramichanstore.backend.modules.catalog.dto;

import com.ramichanstore.backend.modules.preorders.dto.PreorderPublicInfo;
import com.ramichanstore.backend.modules.products.dto.ProductImageResponse;
import com.ramichanstore.backend.modules.products.entity.Product;
import com.ramichanstore.backend.modules.products.entity.ProductStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Versión pública (sin login) de un producto: deliberadamente NO incluye
 * costo de compra, gastos adicionales, costo total, ganancia, margen,
 * ubicación, proveedor ni observaciones internas — esos son datos de negocio,
 * no de catálogo. Solo lo que un cliente necesita para ver/elegir un producto.
 *
 * <p>{@code material}/{@code hasArticulations}/{@code includedAccessories}/
 * {@code packagingMaterial}/{@code originCountry}/{@code releaseDate}/
 * {@code packagedWeightGrams} son la "ficha técnica" (Fase 41) — todos
 * opcionales a propósito: el frontend solo muestra la sección/fila que
 * tenga dato, nunca un campo vacío.</p>
 */
public record PublicProductResponse(
        Long id, String sku, String name, String characterName, String franchise,
        String brandName, String categoryName, String lineName,
        String description, String mainImageUrl, List<ProductImageResponse> images,
        String size, BigDecimal salePrice, boolean inStock, boolean lowStock, int availableQuantity,
        ProductStatus status,
        String material, Boolean hasArticulations, String includedAccessories,
        String packagingMaterial, String originCountry, LocalDate releaseDate,
        BigDecimal packagedWeightGrams,
        PreorderPublicInfo preorderInfo) {

    public static PublicProductResponse from(Product p) {
        return from(p, null);
    }

    /**
     * {@code preorderInfo} solo se resuelve en el detalle público (findPublicById) — nunca en el
     * listado, para no pagar una consulta extra por producto en cada página del catálogo.
     */
    public static PublicProductResponse from(Product p, PreorderPublicInfo preorderInfo) {
        List<ProductImageResponse> images = p.getImages().stream().map(ProductImageResponse::from).toList();
        String mainImageUrl = images.stream()
                .filter(ProductImageResponse::isMain)
                .map(ProductImageResponse::url)
                .findFirst()
                .orElse(p.getMainImageUrl());

        boolean inStock = p.getCurrentStock() > 0 && p.getStatus() != ProductStatus.OUT_OF_STOCK;
        // "Últimas unidades": booleano calculado desde el mismo stock que ya se expone acá abajo.
        boolean lowStock = inStock && p.isLowStock();

        return new PublicProductResponse(
                p.getId(), p.getSku(), p.getName(), p.getCharacterName(), p.getFranchise(),
                p.getBrand().getName(), p.getCategory().getName(),
                p.getLine() != null ? p.getLine().getName() : null,
                p.getDescription(), mainImageUrl, images,
                p.getSize(), p.getSalePrice(),
                inStock, lowStock, p.getCurrentStock(),
                p.getStatus(),
                p.getMaterial(), p.getHasArticulations(), p.getIncludedAccessories(),
                p.getPackagingMaterial(), p.getOriginCountry(), p.getReleaseDate(),
                p.getPackagedWeightGrams(),
                preorderInfo);
    }
}

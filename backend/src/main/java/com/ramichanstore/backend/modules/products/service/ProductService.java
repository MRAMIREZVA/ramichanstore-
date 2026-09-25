package com.ramichanstore.backend.modules.products.service;

import com.ramichanstore.backend.audit.AuditAction;
import com.ramichanstore.backend.audit.AuditService;
import com.ramichanstore.backend.common.exception.BusinessRuleException;
import com.ramichanstore.backend.common.exception.ResourceNotFoundException;
import com.ramichanstore.backend.modules.brands.entity.Brand;
import com.ramichanstore.backend.modules.brands.repository.BrandRepository;
import com.ramichanstore.backend.modules.categories.entity.Category;
import com.ramichanstore.backend.modules.categories.repository.CategoryRepository;
import com.ramichanstore.backend.modules.inventory.repository.InventoryMovementRepository;
import com.ramichanstore.backend.modules.orderrequests.repository.OrderRequestRepository;
import com.ramichanstore.backend.modules.preorders.repository.PreorderRepository;
import com.ramichanstore.backend.modules.productlines.entity.ProductLine;
import com.ramichanstore.backend.modules.productlines.repository.ProductLineRepository;
import com.ramichanstore.backend.modules.products.dto.ProductRequest;
import com.ramichanstore.backend.modules.products.dto.ProductResponse;
import com.ramichanstore.backend.modules.products.entity.Product;
import com.ramichanstore.backend.modules.products.entity.ProductStatus;
import com.ramichanstore.backend.modules.products.repository.ProductRepository;
import com.ramichanstore.backend.modules.products.repository.ProductSpecifications;
import com.ramichanstore.backend.modules.sales.repository.SaleDetailRepository;
import com.ramichanstore.backend.modules.separations.repository.SeparationRepository;
import com.ramichanstore.backend.modules.suppliers.entity.Supplier;
import com.ramichanstore.backend.modules.suppliers.repository.SupplierRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Objects;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Costo total, ganancia y margen SIEMPRE se calculan aquí a partir de precio de
 * compra + gastos adicionales + precio de venta. El DTO de entrada nunca los trae.
 */
@Service
@RequiredArgsConstructor
public class ProductService {

    private static final String MODULE = "PRODUCTS";

    private final ProductRepository productRepository;
    private final BrandRepository brandRepository;
    private final CategoryRepository categoryRepository;
    private final ProductLineRepository productLineRepository;
    private final SupplierRepository supplierRepository;
    private final InventoryMovementRepository inventoryMovementRepository;
    private final SaleDetailRepository saleDetailRepository;
    private final SeparationRepository separationRepository;
    private final PreorderRepository preorderRepository;
    private final OrderRequestRepository orderRequestRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<ProductResponse> search(
            String term, Long categoryId, Long brandId, Long lineId, String franchise, ProductStatus status, Pageable pageable) {
        List<Specification<Product>> specs = Stream.of(
                        ProductSpecifications.search(term),
                        ProductSpecifications.hasCategory(categoryId),
                        ProductSpecifications.hasBrand(brandId),
                        ProductSpecifications.hasLine(lineId),
                        ProductSpecifications.hasFranchise(franchise),
                        ProductSpecifications.hasStatus(status))
                .filter(Objects::nonNull)
                .toList();
        Specification<Product> spec = specs.isEmpty() ? null : Specification.allOf(specs);
        return productRepository.findAll(spec, pageable).map(ProductResponse::from);
    }

    @Transactional(readOnly = true)
    public ProductResponse findResponseById(Long id) {
        return ProductResponse.from(findById(id));
    }

    /**
     * Para el catálogo público (sin login): mismos filtros que {@link #search}, pero nunca
     * incluye descontinuados ni agotados (un producto sin stock no es una vitrina útil para
     * un visitante que no puede comprarlo). {@code onlyPreorder} agrega el filtro "Solo preventas".
     */
    @Transactional(readOnly = true)
    public Page<Product> searchPublic(
            String term, Long categoryId, Long brandId, Long lineId, String franchise, boolean onlyPreorder, Pageable pageable) {
        List<Specification<Product>> specs = Stream.of(
                        ProductSpecifications.search(term),
                        ProductSpecifications.hasCategory(categoryId),
                        ProductSpecifications.hasBrand(brandId),
                        ProductSpecifications.hasLine(lineId),
                        ProductSpecifications.hasFranchise(franchise),
                        ProductSpecifications.excludeStatus(ProductStatus.DISCONTINUED),
                        ProductSpecifications.excludeStatus(ProductStatus.OUT_OF_STOCK),
                        onlyPreorder ? ProductSpecifications.hasStatus(ProductStatus.PREORDER) : null)
                .filter(Objects::nonNull)
                .toList();
        return productRepository.findAll(Specification.allOf(specs), pageable);
    }

    /** Para el filtro "Franquicia" del catálogo público. */
    @Transactional(readOnly = true)
    public List<String> findDistinctFranchises() {
        return productRepository.findDistinctFranchises();
    }

    /**
     * Para el catálogo público: un producto descontinuado o agotado no existe de cara al
     * cliente (404, no 403) — mismo criterio que {@link #searchPublic}, aplicado también al
     * acceso directo por id (un link viejo a un producto que ya se agotó no debe mostrarlo).
     */
    @Transactional(readOnly = true)
    public Product findPublicById(Long id) {
        Product product = findById(id);
        if (product.getStatus() == ProductStatus.DISCONTINUED || product.getStatus() == ProductStatus.OUT_OF_STOCK) {
            throw ResourceNotFoundException.of("Producto", id);
        }
        return product;
    }

    @Transactional(readOnly = true)
    public Product findById(Long id) {
        return productRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Producto", id));
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        String sku = StringUtils.hasText(request.sku()) ? request.sku().trim() : generateSku();
        if (productRepository.existsBySkuIgnoreCase(sku)) {
            throw new BusinessRuleException("Ya existe un producto con el SKU '" + sku + "'");
        }
        Product product = new Product();
        applyRequest(product, request);
        product.setSku(sku);
        Product saved = productRepository.save(product);
        auditService.log(AuditAction.CREATE, MODULE, "Product", saved.getId().toString(), null, summarize(saved));
        return ProductResponse.from(saved);
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = findById(id);
        String sku = StringUtils.hasText(request.sku()) ? request.sku().trim() : product.getSku();
        if (!product.getSku().equalsIgnoreCase(sku) && productRepository.existsBySkuIgnoreCase(sku)) {
            throw new BusinessRuleException("Ya existe un producto con el SKU '" + sku + "'");
        }
        String before = summarize(product);
        applyRequest(product, request);
        product.setSku(sku);
        Product saved = productRepository.save(product);
        auditService.log(AuditAction.UPDATE, MODULE, "Product", id.toString(), before, summarize(saved));
        return ProductResponse.from(saved);
    }

    /**
     * El formulario de alta oculta el SKU a propósito (ver ProductRequest) — se
     * genera acá con un contador simple ("PROD-000123"); si hay colisión (huecos
     * por productos eliminados que "liberaron" un número, o alta concurrente) se
     * prueba el siguiente hasta encontrar uno libre entre los activos.
     */
    private String generateSku() {
        long seq = productRepository.count() + 1;
        String candidate = "PROD-%06d".formatted(seq);
        while (productRepository.existsBySkuIgnoreCase(candidate)) {
            seq++;
            candidate = "PROD-%06d".formatted(seq);
        }
        return candidate;
    }

    @Transactional
    public void delete(Long id) {
        Product product = findById(id);
        if (inventoryMovementRepository.existsByProductId(id) || saleDetailRepository.existsByProductId(id)
                || separationRepository.existsByProductId(id) || preorderRepository.existsByProductId(id)
                || orderRequestRepository.existsByItems_ProductId(id)) {
            throw new BusinessRuleException(
                    "No se puede eliminar el producto \"" + product.getName() + "\" porque todavía tiene movimientos, ventas, separaciones, preventas o pedidos web asociados");
        }
        product.softDelete();
        productRepository.save(product);
        auditService.log(AuditAction.DELETE, MODULE, "Product", id.toString(), summarize(product), null);
    }

    private void applyRequest(Product product, ProductRequest request) {
        product.setName(request.name());
        product.setCharacterName(request.characterName());
        product.setFranchise(request.franchise());
        product.setBrand(resolveBrand(request.brandId()));
        product.setCategory(resolveCategory(request.categoryId()));
        product.setLine(resolveLine(request.lineId()));
        product.setDescription(request.description());
        product.setSize(request.size());
        product.setCurrentStock(request.currentStock());
        product.setMinStock(request.minStock());
        product.setStatus(request.status());
        product.setLocation(request.location());
        product.setEntryDate(request.entryDate());
        product.setSupplier(resolveSupplier(request.supplierId()));
        product.setNotes(request.notes());

        applyCalculatedCosts(product, request.purchasePrice(), request.additionalCosts(), request.salePrice());
    }

    /** Ganancia = Precio de venta - Costo total. Margen % = Ganancia / Precio de venta * 100. */
    private void applyCalculatedCosts(Product product, BigDecimal purchasePrice, BigDecimal additionalCosts, BigDecimal salePrice) {
        BigDecimal totalCost = purchasePrice.add(additionalCosts);
        if (salePrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("El precio de venta debe ser mayor a cero");
        }
        BigDecimal profit = salePrice.subtract(totalCost);
        BigDecimal marginPercent = profit
                .divide(salePrice, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);

        product.setPurchasePrice(purchasePrice);
        product.setAdditionalCosts(additionalCosts);
        product.setTotalCost(totalCost.setScale(2, RoundingMode.HALF_UP));
        product.setSalePrice(salePrice);
        product.setProfit(profit.setScale(2, RoundingMode.HALF_UP));
        product.setMarginPercent(marginPercent);
    }

    private Brand resolveBrand(Long id) {
        return brandRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Marca", id));
    }

    private Category resolveCategory(Long id) {
        return categoryRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Categoría", id));
    }

    private ProductLine resolveLine(Long id) {
        if (id == null) {
            return null;
        }
        return productLineRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Línea", id));
    }

    private Supplier resolveSupplier(Long id) {
        if (id == null) {
            return null;
        }
        return supplierRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Proveedor", id));
    }

    private String summarize(Product product) {
        return "sku=%s, precioVenta=%s, costoTotal=%s, stock=%d, estado=%s"
                .formatted(product.getSku(), product.getSalePrice(), product.getTotalCost(),
                        product.getCurrentStock(), product.getStatus());
    }
}

package com.ramichanstore.backend.modules.products.entity;

import com.ramichanstore.backend.common.base.BaseEntity;
import com.ramichanstore.backend.modules.brands.entity.Brand;
import com.ramichanstore.backend.modules.categories.entity.Category;
import com.ramichanstore.backend.modules.productlines.entity.ProductLine;
import com.ramichanstore.backend.modules.suppliers.entity.Supplier;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "products")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
public class Product extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String sku;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "character_name", length = 150)
    private String characterName;

    @Column(length = 150)
    private String franchise;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "line_id")
    private ProductLine line;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "main_image_url", length = 500)
    private String mainImageUrl;

    @Column(length = 100)
    private String size;

    @Column(name = "purchase_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal purchasePrice;

    @Column(name = "additional_costs", nullable = false, precision = 10, scale = 2)
    private BigDecimal additionalCosts = BigDecimal.ZERO;

    @Column(name = "total_cost", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalCost;

    @Column(name = "sale_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal salePrice;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal profit;

    @Column(name = "margin_percent", nullable = false, precision = 6, scale = 2)
    private BigDecimal marginPercent;

    @Column(name = "current_stock", nullable = false)
    private int currentStock;

    @Column(name = "min_stock", nullable = false)
    private int minStock = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProductStatus status = ProductStatus.AVAILABLE;

    @Column(length = 100)
    private String location;

    @Column(name = "entry_date")
    private LocalDate entryDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @Column(length = 500)
    private String notes;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("sortOrder ASC")
    private List<ProductImage> images = new ArrayList<>();

    public boolean isLowStock() {
        return currentStock <= minStock;
    }
}

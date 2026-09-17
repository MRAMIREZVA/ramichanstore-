-- ============================================================
-- RamichanStore - V2: catálogo de productos (categorías, marcas,
-- líneas, proveedores, productos, imágenes). Fase 1 del roadmap.
-- ============================================================

CREATE TABLE categories (
    id            BIGINT IDENTITY(1,1) PRIMARY KEY,
    name          NVARCHAR(100) NOT NULL,
    description   NVARCHAR(255) NULL,
    created_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by    NVARCHAR(100) NULL,
    updated_by    NVARCHAR(100) NULL,
    deleted_at    DATETIME2     NULL,
    CONSTRAINT UQ_categories_name UNIQUE (name)
);

CREATE TABLE brands (
    id            BIGINT IDENTITY(1,1) PRIMARY KEY,
    name          NVARCHAR(100) NOT NULL,
    description   NVARCHAR(255) NULL,
    created_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by    NVARCHAR(100) NULL,
    updated_by    NVARCHAR(100) NULL,
    deleted_at    DATETIME2     NULL,
    CONSTRAINT UQ_brands_name UNIQUE (name)
);

CREATE TABLE product_lines (
    id            BIGINT IDENTITY(1,1) PRIMARY KEY,
    name          NVARCHAR(100) NOT NULL,
    brand_id      BIGINT        NULL,
    description   NVARCHAR(255) NULL,
    created_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by    NVARCHAR(100) NULL,
    updated_by    NVARCHAR(100) NULL,
    deleted_at    DATETIME2     NULL,
    CONSTRAINT FK_product_lines_brand FOREIGN KEY (brand_id) REFERENCES brands(id)
);
CREATE INDEX IX_product_lines_brand_id ON product_lines(brand_id);

CREATE TABLE suppliers (
    id            BIGINT IDENTITY(1,1) PRIMARY KEY,
    name          NVARCHAR(150) NOT NULL,
    company       NVARCHAR(150) NULL,
    phone         NVARCHAR(30)  NULL,
    whatsapp      NVARCHAR(30)  NULL,
    email         NVARCHAR(150) NULL,
    country       NVARCHAR(80)  NULL,
    address       NVARCHAR(255) NULL,
    notes         NVARCHAR(500) NULL,
    created_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by    NVARCHAR(100) NULL,
    updated_by    NVARCHAR(100) NULL,
    deleted_at    DATETIME2     NULL
);

CREATE TABLE products (
    id                BIGINT IDENTITY(1,1) PRIMARY KEY,
    sku               NVARCHAR(50)   NOT NULL,
    name              NVARCHAR(200)  NOT NULL,
    character_name    NVARCHAR(150)  NULL,
    franchise         NVARCHAR(150)  NULL,
    brand_id          BIGINT         NOT NULL,
    category_id       BIGINT         NOT NULL,
    line_id           BIGINT         NULL,
    description       NVARCHAR(MAX)  NULL,
    main_image_url    NVARCHAR(500)  NULL,
    size              NVARCHAR(100)  NULL,
    purchase_price    DECIMAL(10,2)  NOT NULL,
    additional_costs  DECIMAL(10,2)  NOT NULL DEFAULT 0,
    total_cost        DECIMAL(10,2)  NOT NULL,
    sale_price        DECIMAL(10,2)  NOT NULL,
    profit            DECIMAL(10,2)  NOT NULL,
    margin_percent    DECIMAL(6,2)   NOT NULL,
    current_stock     INT            NOT NULL DEFAULT 0,
    min_stock         INT            NOT NULL DEFAULT 1,
    status            NVARCHAR(20)   NOT NULL DEFAULT 'AVAILABLE',
    location          NVARCHAR(100)  NULL,
    entry_date        DATE           NULL,
    supplier_id       BIGINT         NULL,
    notes             NVARCHAR(500)  NULL,
    created_at        DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at        DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by        NVARCHAR(100)  NULL,
    updated_by        NVARCHAR(100)  NULL,
    deleted_at        DATETIME2      NULL,
    CONSTRAINT UQ_products_sku UNIQUE (sku),
    CONSTRAINT FK_products_brand FOREIGN KEY (brand_id) REFERENCES brands(id),
    CONSTRAINT FK_products_category FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT FK_products_line FOREIGN KEY (line_id) REFERENCES product_lines(id),
    CONSTRAINT FK_products_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    CONSTRAINT CK_products_status CHECK (status IN ('AVAILABLE','OUT_OF_STOCK','PREORDER','COMING_SOON','DISCONTINUED'))
);
CREATE INDEX IX_products_brand_id ON products(brand_id);
CREATE INDEX IX_products_category_id ON products(category_id);
CREATE INDEX IX_products_line_id ON products(line_id);
CREATE INDEX IX_products_supplier_id ON products(supplier_id);
CREATE INDEX IX_products_status ON products(status);
CREATE INDEX IX_products_name ON products(name);

CREATE TABLE product_images (
    id            BIGINT IDENTITY(1,1) PRIMARY KEY,
    product_id    BIGINT        NOT NULL,
    image_url     NVARCHAR(500) NOT NULL,
    sort_order    INT           NOT NULL DEFAULT 0,
    created_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_product_images_product FOREIGN KEY (product_id) REFERENCES products(id)
);
CREATE INDEX IX_product_images_product_id ON product_images(product_id);

-- ========== PERMISOS NUEVOS ==========
INSERT INTO permissions (code, module, description) VALUES
 ('PRODUCT_VIEW','PRODUCTS','Ver productos'),
 ('PRODUCT_CREATE','PRODUCTS','Crear productos'),
 ('PRODUCT_EDIT','PRODUCTS','Editar productos'),
 ('PRODUCT_DELETE','PRODUCTS','Eliminar productos (soft delete)'),
 ('CATALOG_MANAGE','PRODUCTS','Gestionar categorías, marcas, líneas y proveedores');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'ADMIN' AND p.code IN ('PRODUCT_VIEW','PRODUCT_CREATE','PRODUCT_EDIT','PRODUCT_DELETE','CATALOG_MANAGE');

-- ========== SEED: catálogos base ==========
INSERT INTO categories (name, description) VALUES
 ('Figuras', 'Figuras de colección de personajes anime'),
 ('Merchandising', 'Llaveros, posters, tazas y otros artículos de merchandising');

INSERT INTO brands (name, description) VALUES
 ('Banpresto', 'Marca de figuras premio y coleccionables de Bandai Namco'),
 ('Bandai Namco', 'Figuras de línea Figuarts y otras'),
 ('Good Smile Company', 'Figuras Nendoroid y scale figures'),
 ('Megahouse', 'Figuras y coleccionables de gama premium');

INSERT INTO product_lines (name, brand_id, description)
SELECT 'Grandista', b.id, 'Línea premium de gran formato de Banpresto' FROM brands b WHERE b.name = 'Banpresto'
UNION ALL SELECT 'Figurizm', b.id, 'Línea Figurizm de Banpresto' FROM brands b WHERE b.name = 'Banpresto'
UNION ALL SELECT 'Luminasta', b.id, 'Línea Luminasta de Banpresto' FROM brands b WHERE b.name = 'Banpresto'
UNION ALL SELECT 'Match Makers', b.id, 'Línea Match Makers de Banpresto' FROM brands b WHERE b.name = 'Banpresto'
UNION ALL SELECT 'History Box', b.id, 'Línea History Box de Banpresto' FROM brands b WHERE b.name = 'Banpresto'
UNION ALL SELECT 'Maximatic', b.id, 'Línea Maximatic de Banpresto' FROM brands b WHERE b.name = 'Banpresto'
UNION ALL SELECT 'Combination Battle', b.id, 'Línea Combination Battle de Banpresto' FROM brands b WHERE b.name = 'Banpresto';

INSERT INTO suppliers (name, company, phone, whatsapp, email, country, address, notes) VALUES
 ('Importadora Japón Directo', 'Japan Direct Import SAC', '+51 906994401', '+51 906994401', 'contacto@japondirecto.example',
  'Japón', 'Tokio, Japón (envío consolidado a Perú)', 'Proveedor de ejemplo para datos de prueba de Fase 1');

-- ========== SEED: productos de prueba (basados en el catálogo público de RamichanStore) ==========
-- Costos de compra estimados con un margen típico de importación (~35-45%); son datos de PRUEBA.
INSERT INTO products (
    sku, name, character_name, franchise, brand_id, category_id, line_id, description, main_image_url,
    size, purchase_price, additional_costs, total_cost, sale_price, profit, margin_percent,
    current_stock, min_stock, status, location, entry_date, supplier_id
)
SELECT
    v.sku, v.name, v.character_name, v.franchise, b.id, c.id, l.id, v.description, v.main_image_url,
    v.size, v.purchase_price, v.additional_costs,
    (v.purchase_price + v.additional_costs) AS total_cost,
    v.sale_price,
    (v.sale_price - (v.purchase_price + v.additional_costs)) AS profit,
    ROUND((v.sale_price - (v.purchase_price + v.additional_costs)) / v.sale_price * 100, 2) AS margin_percent,
    v.current_stock, v.min_stock, v.status, v.location, v.entry_date, s.id
FROM (VALUES
    ('FIG-DBZ-001', 'Figura Majin Vegeta Dragon Ball Z - History Box', 'Majin Vegeta', 'Dragon Ball Z', 'History Box',
     'Figura de colección de Majin Vegeta, línea History Box de Banpresto.',
     'https://assets.rediredi.com/items/images/33721183-5d40-438c-b7d8-d91ab6983d99_b7086192-9962-4da3-8eae-13a7a7390e4f.jpg?s=medium&f=webp',
     '~14cm', CAST(48.00 AS DECIMAL(10,2)), CAST(9.00 AS DECIMAL(10,2)), CAST(89.00 AS DECIMAL(10,2)),
     12, 3, 'AVAILABLE', 'Estante A1', CAST('2026-08-05' AS DATE)),
    ('FIG-JJK-001', 'Figura Gojo Satoru Jujutsu Kaisen', 'Gojo Satoru', 'Jujutsu Kaisen', NULL,
     'Figura de colección de Gojo Satoru de Jujutsu Kaisen.', NULL,
     '~16cm', CAST(68.00 AS DECIMAL(10,2)), CAST(10.00 AS DECIMAL(10,2)), CAST(129.00 AS DECIMAL(10,2)),
     6, 2, 'AVAILABLE', 'Estante A2', CAST('2026-08-10' AS DATE)),
    ('FIG-DS-001', 'Figura Bandai Demon Slayer Grandista Akaza', 'Akaza', 'Demon Slayer', 'Grandista',
     'Figura de gran formato de Akaza, línea Grandista de Banpresto.', NULL,
     '~28cm', CAST(75.00 AS DECIMAL(10,2)), CAST(12.00 AS DECIMAL(10,2)), CAST(139.00 AS DECIMAL(10,2)),
     4, 2, 'AVAILABLE', 'Estante B1', CAST('2026-08-10' AS DATE)),
    ('FIG-DBS-001', 'Dragon Ball Super Match Makers Son Goku', 'Son Goku', 'Dragon Ball Super', 'Match Makers',
     'Figura Son Goku, línea Match Makers de Banpresto.', NULL,
     '~17cm', CAST(42.00 AS DECIMAL(10,2)), CAST(8.00 AS DECIMAL(10,2)), CAST(79.00 AS DECIMAL(10,2)),
     10, 3, 'AVAILABLE', 'Estante B2', CAST('2026-08-12' AS DATE)),
    ('FIG-DBS-002', 'Dragon Ball Super Match Makers Goku Black - Super Saiyan Rosé', 'Goku Black', 'Dragon Ball Super', 'Match Makers',
     'Figura Goku Black Super Saiyan Rosé, línea Match Makers de Banpresto.', NULL,
     '~17cm', CAST(45.00 AS DECIMAL(10,2)), CAST(8.00 AS DECIMAL(10,2)), CAST(85.00 AS DECIMAL(10,2)),
     8, 3, 'AVAILABLE', 'Estante B2', CAST('2026-08-12' AS DATE)),
    ('FIG-HXH-001', 'Hunter x Hunter Grandista - Kurapika', 'Kurapika', 'Hunter x Hunter', 'Grandista',
     'Figura de gran formato de Kurapika, línea Grandista de Banpresto.', NULL,
     '~25cm', CAST(52.00 AS DECIMAL(10,2)), CAST(9.00 AS DECIMAL(10,2)), CAST(99.00 AS DECIMAL(10,2)),
     5, 2, 'AVAILABLE', 'Estante B3', CAST('2026-08-15' AS DATE)),
    ('FIG-NAR-001', 'Figura Uchiha Itachi Grandista Naruto Shippuden', 'Itachi Uchiha', 'Naruto Shippuden', 'Grandista',
     'Figura de gran formato de Itachi Uchiha, línea Grandista de Banpresto.', NULL,
     '~27cm', CAST(75.00 AS DECIMAL(10,2)), CAST(11.00 AS DECIMAL(10,2)), CAST(139.00 AS DECIMAL(10,2)),
     3, 2, 'AVAILABLE', 'Estante C1', CAST('2026-08-16' AS DATE)),
    ('FIG-MHA-001', 'My Hero Academia Combination Battle - Izuku Midoriya & Tomura Shigaraki', 'Izuku Midoriya / Tomura Shigaraki',
     'My Hero Academia', 'Combination Battle',
     'Set de figuras Izuku Midoriya y Tomura Shigaraki, línea Combination Battle de Banpresto.', NULL,
     '~16cm', CAST(65.00 AS DECIMAL(10,2)), CAST(10.00 AS DECIMAL(10,2)), CAST(120.00 AS DECIMAL(10,2)),
     4, 2, 'AVAILABLE', 'Estante C2', CAST('2026-08-18' AS DATE)),
    ('FIG-DS-PRE-001', 'Preventa - Demon Slayer Luminasta - Tanjiro Kamado', 'Tanjiro Kamado', 'Demon Slayer', 'Luminasta',
     'Figura de Tanjiro Kamado en preventa, línea Luminasta de Banpresto.', NULL,
     '~18cm', CAST(42.00 AS DECIMAL(10,2)), CAST(8.00 AS DECIMAL(10,2)), CAST(79.00 AS DECIMAL(10,2)),
     0, 2, 'PREORDER', 'Preventa - sin ubicación', CAST('2026-09-01' AS DATE)),
    ('FIG-OP-PRE-001', 'Preventa - One Piece Grandista - Shanks II', 'Shanks', 'One Piece', 'Grandista',
     'Figura de gran formato de Shanks (versión II) en preventa, línea Grandista de Banpresto.', NULL,
     '~26cm', CAST(45.00 AS DECIMAL(10,2)), CAST(9.00 AS DECIMAL(10,2)), CAST(85.00 AS DECIMAL(10,2)),
     0, 2, 'PREORDER', 'Preventa - sin ubicación', CAST('2026-09-05' AS DATE))
) AS v(sku, name, character_name, franchise, line_name, description, main_image_url, size, purchase_price, additional_costs, sale_price, current_stock, min_stock, status, location, entry_date)
JOIN brands b ON b.name = 'Banpresto'
JOIN categories c ON c.name = 'Figuras'
JOIN suppliers s ON s.name = 'Importadora Japón Directo'
LEFT JOIN product_lines l ON l.name = v.line_name AND l.brand_id = b.id;

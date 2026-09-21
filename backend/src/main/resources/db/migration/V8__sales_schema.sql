-- ============================================================
-- RamichanStore - V8: ventas (Fase 5). `sales` es la cabecera,
-- `sale_details` la línea de detalle (hijo inmutable de `sales`,
-- igual que product_images de products — no tiene ciclo de vida
-- propio, se crea/borra junto con la venta). unit_cost y unit_price
-- se guardan como snapshot en el momento de la venta: si el costo
-- o precio del producto cambia después, el historial de la venta
-- no debe mentir sobre lo que realmente se cobró/costó ese día.
-- No hay UPDATE de venta: solo creación y cancelación (revierte
-- stock vía un movimiento DEVOLUCION en inventory_movements).
-- ============================================================

CREATE TABLE sales (
    id                BIGINT IDENTITY(1,1) PRIMARY KEY,
    customer_id       BIGINT        NULL,
    sale_date         DATE          NOT NULL,
    payment_method    NVARCHAR(20)  NOT NULL,
    payment_status    NVARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    delivery_method   NVARCHAR(20)  NOT NULL,
    subtotal          DECIMAL(10,2) NOT NULL,
    total             DECIMAL(10,2) NOT NULL,
    total_cost        DECIMAL(10,2) NOT NULL,
    profit            DECIMAL(10,2) NOT NULL,
    points_generated  INT           NOT NULL DEFAULT 0,
    notes             NVARCHAR(500) NULL,
    created_at        DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at        DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by        NVARCHAR(100) NULL,
    updated_by        NVARCHAR(100) NULL,
    deleted_at        DATETIME2     NULL,
    CONSTRAINT FK_sales_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT CK_sales_payment_method CHECK (payment_method IN ('YAPE','PLIN','TRANSFERENCIA','EFECTIVO','TARJETA','OTROS')),
    CONSTRAINT CK_sales_payment_status CHECK (payment_status IN ('PENDING','PARTIAL','PAID','CANCELLED')),
    CONSTRAINT CK_sales_delivery_method CHECK (delivery_method IN ('PICKUP','DELIVERY','AGENCY'))
);
CREATE INDEX IX_sales_customer_id ON sales(customer_id);
CREATE INDEX IX_sales_sale_date ON sales(sale_date);
CREATE INDEX IX_sales_payment_status ON sales(payment_status);

CREATE TABLE sale_details (
    id            BIGINT IDENTITY(1,1) PRIMARY KEY,
    sale_id       BIGINT        NOT NULL,
    product_id    BIGINT        NOT NULL,
    quantity      INT           NOT NULL,
    unit_price    DECIMAL(10,2) NOT NULL,
    discount      DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit_cost     DECIMAL(10,2) NOT NULL,
    subtotal      DECIMAL(10,2) NOT NULL,
    CONSTRAINT FK_sale_details_sale FOREIGN KEY (sale_id) REFERENCES sales(id),
    CONSTRAINT FK_sale_details_product FOREIGN KEY (product_id) REFERENCES products(id)
);
CREATE INDEX IX_sale_details_sale_id ON sale_details(sale_id);
CREATE INDEX IX_sale_details_product_id ON sale_details(product_id);

-- ========== PERMISOS ==========
INSERT INTO permissions (code, module, description) VALUES
 ('SALE_VIEW', 'SALES', 'Ver ventas'),
 ('SALE_CREATE', 'SALES', 'Registrar ventas'),
 ('SALE_CANCEL', 'SALES', 'Cancelar ventas (revierte stock)');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'ADMIN' AND p.code IN ('SALE_VIEW', 'SALE_CREATE', 'SALE_CANCEL');

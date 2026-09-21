-- ============================================================
-- RamichanStore - V17: pedidos web desde el carrito del catálogo
-- público (sin login). Un pedido web NO es una Venta real: queda
-- como solicitud PENDING hasta que el admin la revisa y la
-- convierte a una Sale real (descuenta stock recién ahí) o la
-- rechaza — evita que un visitante bloquee stock real con un
-- pedido falso o sin intención de pagar.
-- ============================================================

CREATE TABLE order_requests (
    id                       BIGINT IDENTITY(1,1) PRIMARY KEY,
    guest_name               NVARCHAR(200) NOT NULL,
    guest_phone              NVARCHAR(30)  NOT NULL,
    guest_whatsapp           NVARCHAR(30)  NULL,
    guest_address            NVARCHAR(255) NULL,
    guest_district           NVARCHAR(100) NULL,
    preferred_payment_method NVARCHAR(20)  NOT NULL,
    delivery_method          NVARCHAR(20)  NOT NULL,
    notes                    NVARCHAR(500) NULL,
    status                   NVARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    rejection_reason         NVARCHAR(500) NULL,
    converted_sale_id        BIGINT NULL,
    created_at               DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at               DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by               NVARCHAR(100) NULL,
    updated_by               NVARCHAR(100) NULL,
    deleted_at               DATETIME2 NULL,
    CONSTRAINT FK_order_requests_converted_sale FOREIGN KEY (converted_sale_id) REFERENCES sales(id),
    CONSTRAINT CK_order_requests_status CHECK (status IN ('PENDING','CONVERTED','REJECTED')),
    CONSTRAINT CK_order_requests_payment_method CHECK (preferred_payment_method IN ('YAPE','PLIN','TRANSFERENCIA','EFECTIVO','TARJETA','OTROS')),
    CONSTRAINT CK_order_requests_delivery_method CHECK (delivery_method IN ('PICKUP','DELIVERY','AGENCY'))
);
CREATE INDEX IX_order_requests_status ON order_requests(status);
CREATE INDEX IX_order_requests_created_at ON order_requests(created_at);

-- Compra puntual dentro de un pedido web. Hijo sin ciclo de vida propio
-- (cascade ALL + orphanRemoval desde OrderRequest), igual que SaleDetail.
-- unit_price es un snapshot del precio de venta del producto en el momento
-- del submit — nunca se confía en un precio que mande el frontend.
CREATE TABLE order_request_items (
    id               BIGINT IDENTITY(1,1) PRIMARY KEY,
    order_request_id BIGINT NOT NULL,
    product_id       BIGINT NOT NULL,
    quantity         INT NOT NULL,
    unit_price       DECIMAL(10,2) NOT NULL,
    subtotal         DECIMAL(10,2) NOT NULL,
    CONSTRAINT FK_order_request_items_order FOREIGN KEY (order_request_id) REFERENCES order_requests(id),
    CONSTRAINT FK_order_request_items_product FOREIGN KEY (product_id) REFERENCES products(id)
);
CREATE INDEX IX_order_request_items_order_id ON order_request_items(order_request_id);

-- ========== PERMISOS ==========
INSERT INTO permissions (code, module, description) VALUES
 ('ORDER_REQUEST_VIEW', 'ORDER_REQUESTS', 'Ver pedidos web (carrito del catálogo público)'),
 ('ORDER_REQUEST_MANAGE', 'ORDER_REQUESTS', 'Aprobar (convertir a venta) o rechazar pedidos web');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'ADMIN' AND p.code IN ('ORDER_REQUEST_VIEW', 'ORDER_REQUEST_MANAGE');

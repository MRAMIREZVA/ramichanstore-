-- ============================================================
-- RamichanStore - V19: Embarques desde Japón — digitaliza la planilla
-- Excel que se llevaba a mano para consolidar compras vía cuentas
-- proxy (Zenmarket u similar) y su envío a Perú.
-- ============================================================

-- Titular de la cuenta de compra (ej. Zenmarket) usada para consolidar el
-- embarque — catálogo editable, mismo patrón que categories/brands.
CREATE TABLE shipment_holders (
    id          BIGINT IDENTITY(1,1) PRIMARY KEY,
    name        NVARCHAR(150) NOT NULL,
    zen_account NVARCHAR(50) NULL,
    notes       NVARCHAR(255) NULL,
    created_at  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by  NVARCHAR(100) NULL,
    updated_by  NVARCHAR(100) NULL,
    deleted_at  DATETIME2 NULL
);
CREATE UNIQUE INDEX UQ_shipment_holders_name ON shipment_holders(name) WHERE deleted_at IS NULL;

-- "Días en ruta" y "diferencia de peso" del Excel original NO se guardan acá:
-- se calculan al leer (ver ShipmentResponse), mismo criterio del resto del
-- proyecto para valores derivables (días en ruta = hoy o fecha de llegada
-- menos fecha de salida; diferencia de peso = peso final - peso figuras).
CREATE TABLE shipments (
    id                           BIGINT IDENTITY(1,1) PRIMARY KEY,
    code                         NVARCHAR(50) NOT NULL,
    holder_id                    BIGINT NOT NULL,
    zen_order_number             NVARCHAR(50) NULL,
    product_cost                 DECIMAL(10,2) NULL,
    shipping_cost                DECIMAL(10,2) NULL,
    commission_cost              DECIMAL(10,2) NULL,
    domestic_japan_shipping_cost DECIMAL(10,2) NULL,
    additional_cost              DECIMAL(10,2) NULL,
    total_soles                  DECIMAL(10,2) NULL,
    total_dollars                DECIMAL(10,2) NULL,
    handling_cost                DECIMAL(10,2) NULL,
    final_cost                   DECIMAL(10,2) NULL,
    shipment_type                NVARCHAR(20) NOT NULL,
    departure_date                DATE NULL,
    arrival_date                 DATE NULL,
    travel_days                  INT NULL,
    possible_arrival_date        DATE NULL,
    figures_weight               DECIMAL(10,2) NULL,
    final_weight                 DECIMAL(10,2) NULL,
    status                       NVARCHAR(30) NOT NULL DEFAULT 'PENDIENTE_ENVIO',
    notes                        NVARCHAR(500) NULL,
    created_at                   DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at                   DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                   NVARCHAR(100) NULL,
    updated_by                   NVARCHAR(100) NULL,
    deleted_at                   DATETIME2 NULL,
    CONSTRAINT FK_shipments_holder FOREIGN KEY (holder_id) REFERENCES shipment_holders(id),
    CONSTRAINT CK_shipments_type CHECK (shipment_type IN ('EMS','AVIA','BARCO')),
    CONSTRAINT CK_shipments_status CHECK (status IN (
        'PENDIENTE_ENVIO','EN_COTIZACION_ENVIO','PENDIENTE_PAGO','EN_CAMINO',
        'LLEGO_A_SERPOST','OBSERVADO_ADUANAS','LISTO_PARA_DELIVERY','EN_TIENDA','LLEGO_A_PERU'))
);
CREATE UNIQUE INDEX UQ_shipments_code ON shipments(code) WHERE deleted_at IS NULL;
CREATE INDEX IX_shipments_holder_id ON shipments(holder_id);
CREATE INDEX IX_shipments_status ON shipments(status);

-- Línea de detalle del embarque (qué trae). Hijo sin ciclo de vida propio
-- (cascade ALL + orphanRemoval desde Shipment, igual que SaleDetail).
-- Texto libre a propósito: los códigos internos del proveedor (ej. PWTL710)
-- no coinciden con el formato de SKU que ya usa el catálogo (PROD-000123).
CREATE TABLE shipment_items (
    id            BIGINT IDENTITY(1,1) PRIMARY KEY,
    shipment_id   BIGINT NOT NULL,
    article_code  NVARCHAR(50) NULL,
    description   NVARCHAR(300) NOT NULL,
    quantity      INT NOT NULL,
    CONSTRAINT FK_shipment_items_shipment FOREIGN KEY (shipment_id) REFERENCES shipments(id)
);
CREATE INDEX IX_shipment_items_shipment_id ON shipment_items(shipment_id);

-- ========== PERMISOS ==========
INSERT INTO permissions (code, module, description) VALUES
 ('SHIPMENT_VIEW', 'SHIPMENTS', 'Ver embarques desde Japón y sus titulares'),
 ('SHIPMENT_MANAGE', 'SHIPMENTS', 'Crear, editar y eliminar embarques y titulares');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'ADMIN' AND p.code IN ('SHIPMENT_VIEW', 'SHIPMENT_MANAGE');

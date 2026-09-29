-- ============================================================
-- RamichanStore - V44: indicadores de tráfico del catálogo público (Fase 63)
-- — el dueño pidió verlos DENTRO del propio sistema (Reportes), no solo en
-- Google Analytics/Meta Pixel (V42, Fase 47). Ledger append-only, mismo
-- criterio que inventory_movements/audit_logs/loyalty_point_movements: nunca
-- se edita ni se borra, sin soft delete ni columnas de auditoría de fila.
-- ============================================================

CREATE TABLE catalog_page_views (
    id          BIGINT IDENTITY(1,1) PRIMARY KEY,
    event_type  NVARCHAR(20) NOT NULL,
    product_id  BIGINT NULL,
    visitor_id  NVARCHAR(64) NOT NULL,
    created_at  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_catalog_page_views_event_type CHECK (event_type IN ('CATALOG_HOME', 'PRODUCT_VIEW')),
    CONSTRAINT FK_catalog_page_views_product FOREIGN KEY (product_id) REFERENCES products(id)
);
GO

-- Filtrar por rango de fechas (como el resto de Reportes) y agregar "más vistos".
CREATE INDEX IX_catalog_page_views_created_at ON catalog_page_views(created_at);
GO

CREATE INDEX IX_catalog_page_views_product_id ON catalog_page_views(product_id);
GO

-- ============================================================
-- RamichanStore - V38: código de barras propio por producto, a pedido
-- explícito del dueño ("quiero que los productos tengan su código de
-- barra para usarlos e imprimirlos"). No reemplaza el SKU (que ya es
-- único y ya se usa en todo el sistema) — es el código de FÁBRICA
-- (EAN/JAN impreso en la caja por Bandai/Banpresto/etc.), que el admin
-- escanea una sola vez al recibir el producto. La etiqueta PROPIA que
-- se imprime desde el admin sigue codificando el SKU (nunca se guarda
-- una imagen ni un código aparte para eso — se genera al vuelo, mismo
-- criterio de "nunca guardar lo que se puede calcular" del proyecto).
-- Opcional y con índice único filtrado (mismo patrón que todo campo
-- único en una tabla con soft delete, ver lección de Fase 1).
-- ============================================================

ALTER TABLE products ADD barcode NVARCHAR(64) NULL;
GO

CREATE UNIQUE INDEX UQ_products_barcode ON products(barcode) WHERE barcode IS NOT NULL AND deleted_at IS NULL;
GO

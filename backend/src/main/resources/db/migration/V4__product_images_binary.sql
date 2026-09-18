-- ============================================================
-- RamichanStore - V4: las imágenes de producto pasan a guardarse
-- como binario en la base de datos (no URLs externas), permitiendo
-- subir varias imágenes por producto y marcar una como principal
-- para su uso futuro en el catálogo público.
-- ============================================================

ALTER TABLE product_images ALTER COLUMN image_url NVARCHAR(500) NULL;

ALTER TABLE product_images ADD
    file_name     NVARCHAR(255)   NULL,
    content_type  NVARCHAR(100)   NULL,
    image_data    VARBINARY(MAX)  NULL,
    is_main       BIT             NOT NULL DEFAULT 0;

CREATE INDEX IX_product_images_is_main ON product_images(product_id, is_main);

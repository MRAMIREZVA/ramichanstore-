-- ============================================================
-- RamichanStore - V23: cada artículo de un embarque puede tener su
-- propia foto (binario en BD, mismo patrón que product_images) —
-- una sola imagen por artículo, no una galería, así que va como
-- columnas directas en shipment_items en vez de una tabla hija nueva.
-- ============================================================

ALTER TABLE shipment_items ADD
    image_file_name    NVARCHAR(255)   NULL,
    image_content_type NVARCHAR(100)   NULL,
    image_data          VARBINARY(MAX) NULL;

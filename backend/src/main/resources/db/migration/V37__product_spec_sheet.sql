-- ============================================================
-- RamichanStore - V37: ficha técnica de producto ("Información General",
-- "Diseño y Detalles", "Especificaciones del Empaque", "Información
-- Adicional") a pedido explícito del dueño, calcada de la estructura que
-- usan otras tiendas del rubro (ver figura de referencia: HUNTER X HUNTER
-- GRANDISTA - KURAPIKA). Serie/Colección y Fabricante NO son columnas
-- nuevas — ya existen como product_lines.name y brands.name; el resto
-- son campos nuevos, todos opcionales (una ficha vieja no tiene por qué
-- tener todos los datos, el catálogo público solo muestra lo que exista).
-- ============================================================

ALTER TABLE products ADD material NVARCHAR(150) NULL;
GO
ALTER TABLE products ADD has_articulations BIT NULL;
GO
ALTER TABLE products ADD included_accessories NVARCHAR(300) NULL;
GO
ALTER TABLE products ADD packaging_material NVARCHAR(150) NULL;
GO
ALTER TABLE products ADD origin_country NVARCHAR(100) NULL;
GO
ALTER TABLE products ADD release_date DATE NULL;
GO
ALTER TABLE products ADD packaged_weight_grams DECIMAL(10, 2) NULL;
GO

-- Anuncio/popup de bienvenida del catálogo público, mismo criterio "singleton"
-- binario en BD que catalog_banner (id fijo = 1, ver V15). Se muestra en un
-- panel flotante una vez por visita al entrar al catálogo. Sin fila = no se
-- muestra nada (el admin sube/reemplaza/quita la imagen desde Configuración).
CREATE TABLE catalog_announcement (
    id BIGINT NOT NULL PRIMARY KEY,
    file_name NVARCHAR(255) NULL,
    content_type NVARCHAR(50) NOT NULL,
    image_data VARBINARY(MAX) NOT NULL,
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by NVARCHAR(100) NULL
);

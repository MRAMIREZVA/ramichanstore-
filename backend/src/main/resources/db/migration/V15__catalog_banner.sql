-- Banner de inicio del catálogo público, guardado como binario en la BD (mismo
-- criterio que product_images — ver sección 6.1 de CLAUDE.md). Tabla "singleton":
-- siempre a lo más una fila (id fijo = 1), la sube/reemplaza el admin desde
-- Configuración. Sin fila = el catálogo muestra el degradado por defecto.
CREATE TABLE catalog_banner (
    id BIGINT NOT NULL PRIMARY KEY,
    file_name NVARCHAR(255) NULL,
    content_type NVARCHAR(50) NOT NULL,
    image_data VARBINARY(MAX) NOT NULL,
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by NVARCHAR(100) NULL
);

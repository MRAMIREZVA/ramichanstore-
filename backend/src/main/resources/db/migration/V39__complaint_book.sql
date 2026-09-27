-- ============================================================
-- RamichanStore - V39: Libro de Reclamaciones Virtual. Obligatorio por ley
-- para toda tienda online en Perú (Código de Protección y Defensa del
-- Consumidor, Ley 29571 + D.S. 011-2011-PCM) — identificado desde la Fase 36
-- pero nunca priorizado hasta ahora, a pedido explícito del dueño.
--
-- Un Reclamo es una disconformidad relacionada a los productos/servicios; una
-- Queja es una disconformidad NO relacionada a ellos (o referida al mal trato
-- al consumidor) — la ley exige distinguir el tipo, no es un detalle opcional.
--
-- `folio_number` es el correlativo legal visible para el consumidor (ej.
-- "RQ-000123"), generado igual que ProductService.generateSku() — mismo
-- criterio de "campo único opcional... índice único filtrado" del proyecto,
-- salvo que acá SÍ es obligatorio (todo reclamo real necesita su folio).
-- ============================================================

CREATE TABLE complaints (
    id                       BIGINT IDENTITY(1,1) PRIMARY KEY,
    folio_number             NVARCHAR(20)  NOT NULL,
    type                     NVARCHAR(20)  NOT NULL,
    consumer_full_name       NVARCHAR(200) NOT NULL,
    consumer_document_type   NVARCHAR(20)  NOT NULL,
    consumer_document_number NVARCHAR(20)  NOT NULL,
    consumer_address         NVARCHAR(255) NOT NULL,
    consumer_email           NVARCHAR(150) NOT NULL,
    consumer_phone           NVARCHAR(30)  NOT NULL,
    is_minor                 BIT           NOT NULL DEFAULT 0,
    guardian_full_name       NVARCHAR(200) NULL,
    guardian_document_number NVARCHAR(20)  NULL,
    good_description         NVARCHAR(500) NOT NULL,
    claimed_amount           DECIMAL(10,2) NULL,
    detail                   NVARCHAR(MAX) NOT NULL,
    consumer_request         NVARCHAR(MAX) NOT NULL,
    status                   NVARCHAR(20)  NOT NULL DEFAULT 'PENDIENTE',
    provider_response        NVARCHAR(MAX) NULL,
    responded_at             DATETIME2     NULL,
    created_at               DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at               DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by               NVARCHAR(100) NULL,
    updated_by               NVARCHAR(100) NULL,
    deleted_at               DATETIME2     NULL,
    CONSTRAINT CK_complaints_type CHECK (type IN ('RECLAMO', 'QUEJA')),
    CONSTRAINT CK_complaints_status CHECK (status IN ('PENDIENTE', 'EN_PROCESO', 'RESUELTO'))
);
GO

CREATE UNIQUE INDEX UQ_complaints_folio_number ON complaints(folio_number) WHERE deleted_at IS NULL;
GO
CREATE INDEX IX_complaints_status ON complaints(status);
GO
CREATE INDEX IX_complaints_created_at ON complaints(created_at);
GO

-- ========== PERMISOS ==========
INSERT INTO permissions (code, module, description) VALUES
 ('COMPLAINT_VIEW', 'COMPLAINTS', 'Ver el Libro de Reclamaciones'),
 ('COMPLAINT_MANAGE', 'COMPLAINTS', 'Responder reclamos y quejas');
GO

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'ADMIN' AND p.code IN ('COMPLAINT_VIEW', 'COMPLAINT_MANAGE');
GO

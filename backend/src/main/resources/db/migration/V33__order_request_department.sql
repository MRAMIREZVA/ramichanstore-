-- ============================================================
-- RamichanStore - V33: falta "Departamento" en el checkout del catálogo
-- cuando el envío es por agencia — Entregas (admin) ya lo pedía desde
-- Fase 28, el checkout público solo tenía Provincia/Distrito.
-- ============================================================

ALTER TABLE order_requests ADD guest_department NVARCHAR(100) NULL;
GO

-- Fase 80: seguimiento en linea de Serpost para un embarque, con el ultimo estado conocido
-- cacheado (nunca se pisa si la consulta en vivo falla o no devuelve informacion).
ALTER TABLE shipments ADD serpost_tracking_code NVARCHAR(64) NULL;
GO

ALTER TABLE shipments ADD serpost_status NVARCHAR(500) NULL;
GO

ALTER TABLE shipments ADD serpost_status_at DATETIME2 NULL;
GO

ALTER TABLE shipments ADD serpost_checked_at DATETIME2 NULL;
GO

-- Se ejecuta una sola vez contra la instancia SQL Server del contenedor, antes
-- de que el backend arranque (ver docker-compose.yml, servicio db-init).
-- Crea la base de datos y un login dedicado para la app (nunca usar "sa" como
-- credencial de runtime — mismo criterio que la máquina de desarrollo local,
-- ver CLAUDE.md sección 7: login "ramichan_app" con db_owner SOLO sobre esta BD).

IF DB_ID('RamichanStoreDB') IS NULL
BEGIN
    CREATE DATABASE RamichanStoreDB;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'ramichan_app')
BEGIN
    DECLARE @sql NVARCHAR(MAX) = 'CREATE LOGIN ramichan_app WITH PASSWORD = ''' + REPLACE('$(APP_PASSWORD)', '''', '''''') + ''', CHECK_POLICY = OFF';
    EXEC sp_executesql @sql;
END
GO

USE RamichanStoreDB;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'ramichan_app')
BEGIN
    CREATE USER ramichan_app FOR LOGIN ramichan_app;
    ALTER ROLE db_owner ADD MEMBER ramichan_app;
END
GO

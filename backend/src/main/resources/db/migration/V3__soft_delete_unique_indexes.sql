-- ============================================================
-- RamichanStore - V3: las restricciones UNIQUE de tablas con
-- eliminación lógica deben ignorar los registros ya eliminados
-- (deleted_at IS NOT NULL); si no, un SKU/usuario/email eliminado
-- bloquea para siempre volver a usarse. Se reemplazan por índices
-- únicos filtrados (patrón estándar de SQL Server para soft delete).
-- ============================================================

ALTER TABLE roles DROP CONSTRAINT UQ_roles_name;
CREATE UNIQUE INDEX UQ_roles_name ON roles(name) WHERE deleted_at IS NULL;

ALTER TABLE permissions DROP CONSTRAINT UQ_permissions_code;
CREATE UNIQUE INDEX UQ_permissions_code ON permissions(code) WHERE deleted_at IS NULL;

ALTER TABLE users DROP CONSTRAINT UQ_users_username;
CREATE UNIQUE INDEX UQ_users_username ON users(username) WHERE deleted_at IS NULL;

ALTER TABLE users DROP CONSTRAINT UQ_users_email;
CREATE UNIQUE INDEX UQ_users_email ON users(email) WHERE deleted_at IS NULL;

ALTER TABLE categories DROP CONSTRAINT UQ_categories_name;
CREATE UNIQUE INDEX UQ_categories_name ON categories(name) WHERE deleted_at IS NULL;

ALTER TABLE brands DROP CONSTRAINT UQ_brands_name;
CREATE UNIQUE INDEX UQ_brands_name ON brands(name) WHERE deleted_at IS NULL;

ALTER TABLE products DROP CONSTRAINT UQ_products_sku;
CREATE UNIQUE INDEX UQ_products_sku ON products(sku) WHERE deleted_at IS NULL;

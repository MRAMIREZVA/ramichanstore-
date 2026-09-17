-- ============================================================
-- RamichanStore - V1: esquema núcleo (roles, permisos, usuarios,
-- configuración y auditoría). Fase 0 del roadmap.
-- ============================================================

-- ========== ROLES ==========
CREATE TABLE roles (
    id            BIGINT IDENTITY(1,1) PRIMARY KEY,
    name          NVARCHAR(50)  NOT NULL,
    description   NVARCHAR(255) NULL,
    created_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by    NVARCHAR(100) NULL,
    updated_by    NVARCHAR(100) NULL,
    deleted_at    DATETIME2     NULL,
    CONSTRAINT UQ_roles_name UNIQUE (name)
);

-- ========== PERMISSIONS ==========
CREATE TABLE permissions (
    id            BIGINT IDENTITY(1,1) PRIMARY KEY,
    code          NVARCHAR(100) NOT NULL,
    module        NVARCHAR(50)  NOT NULL,
    description   NVARCHAR(255) NULL,
    created_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by    NVARCHAR(100) NULL,
    updated_by    NVARCHAR(100) NULL,
    deleted_at    DATETIME2     NULL,
    CONSTRAINT UQ_permissions_code UNIQUE (code)
);
CREATE INDEX IX_permissions_module ON permissions(module);

-- ========== ROLE_PERMISSIONS ==========
CREATE TABLE role_permissions (
    role_id       BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    CONSTRAINT PK_role_permissions PRIMARY KEY (role_id, permission_id),
    CONSTRAINT FK_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id),
    CONSTRAINT FK_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id)
);

-- ========== USERS ==========
CREATE TABLE users (
    id             BIGINT IDENTITY(1,1) PRIMARY KEY,
    username       NVARCHAR(50)  NOT NULL,
    email          NVARCHAR(150) NOT NULL,
    password_hash  NVARCHAR(255) NOT NULL,
    full_name      NVARCHAR(150) NOT NULL,
    role_id        BIGINT        NOT NULL,
    is_active      BIT           NOT NULL DEFAULT 1,
    last_login_at  DATETIME2     NULL,
    created_at     DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at     DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by     NVARCHAR(100) NULL,
    updated_by     NVARCHAR(100) NULL,
    deleted_at     DATETIME2     NULL,
    CONSTRAINT UQ_users_username UNIQUE (username),
    CONSTRAINT UQ_users_email UNIQUE (email),
    CONSTRAINT FK_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
);
CREATE INDEX IX_users_role_id ON users(role_id);

-- ========== SETTINGS ==========
CREATE TABLE settings (
    id             BIGINT IDENTITY(1,1) PRIMARY KEY,
    setting_key    NVARCHAR(100) NOT NULL,
    setting_value  NVARCHAR(500) NOT NULL,
    data_type      NVARCHAR(20)  NOT NULL DEFAULT 'STRING',
    category       NVARCHAR(50)  NULL,
    description    NVARCHAR(255) NULL,
    created_at     DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at     DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by     NVARCHAR(100) NULL,
    CONSTRAINT UQ_settings_key UNIQUE (setting_key),
    CONSTRAINT CK_settings_data_type CHECK (data_type IN ('STRING','NUMBER','BOOLEAN','JSON'))
);

-- ========== AUDIT_LOGS ==========
CREATE TABLE audit_logs (
    id            BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id       BIGINT NULL,
    username      NVARCHAR(50)  NULL,
    action        NVARCHAR(30)  NOT NULL,
    module        NVARCHAR(50)  NOT NULL,
    entity_name   NVARCHAR(100) NULL,
    entity_id     NVARCHAR(50)  NULL,
    old_value     NVARCHAR(MAX) NULL,
    new_value     NVARCHAR(MAX) NULL,
    ip_address    NVARCHAR(50)  NULL,
    created_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT CK_audit_logs_action CHECK (action IN
        ('CREATE','UPDATE','DELETE','RESTORE','LOGIN','LOGOUT','LOGIN_FAILED','EXPORT'))
);
CREATE INDEX IX_audit_logs_module ON audit_logs(module);
CREATE INDEX IX_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IX_audit_logs_created_at ON audit_logs(created_at);

-- ========== SEED DATA ==========
INSERT INTO roles (name, description) VALUES ('ADMIN', 'Administrador con acceso total al sistema');

INSERT INTO permissions (code, module, description) VALUES
 ('USER_VIEW','USERS','Ver usuarios'), ('USER_CREATE','USERS','Crear usuarios'),
 ('USER_EDIT','USERS','Editar usuarios'), ('USER_DELETE','USERS','Eliminar usuarios (soft delete)'),
 ('ROLE_MANAGE','USERS','Gestionar roles y permisos'),
 ('SETTINGS_VIEW','SETTINGS','Ver configuración'), ('SETTINGS_EDIT','SETTINGS','Editar configuración'),
 ('AUDIT_VIEW','AUDIT','Ver bitácora de auditoría'),
 ('DASHBOARD_VIEW','DASHBOARD','Ver dashboard principal');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name = 'ADMIN';

-- Password semilla: "Admin123!" (hash bcrypt real, generado con BCryptPasswordEncoder).
-- DEBE cambiarse en el primer inicio de sesión real.
INSERT INTO users (username, email, password_hash, full_name, role_id, is_active)
SELECT 'admin', 'mramirezv2015@gmail.com', '$2a$10$OKcwNstCpl2y299gmsxVluCN/nfrSAhe4Ci/qq/CUvaSQozdpIbAW',
       'Administrador RamichanStore', r.id, 1
FROM roles r WHERE r.name = 'ADMIN';

INSERT INTO settings (setting_key, setting_value, data_type, category, description) VALUES
 ('LOYALTY_POINTS_PER_SOL', '1', 'NUMBER', 'LOYALTY', 'Puntos otorgados por cada S/ 1.00 en compras'),
 ('LOYALTY_SOL_VALUE_PER_POINT', '0.10', 'NUMBER', 'LOYALTY', 'Valor en soles de cada punto al canjear'),
 ('CURRENCY_CODE', 'PEN', 'STRING', 'GENERAL', 'Moneda del sistema'),
 ('LOCALE', 'es-PE', 'STRING', 'GENERAL', 'Locale regional del sistema'),
 ('STORE_NAME', 'RamichanStore', 'STRING', 'GENERAL', 'Nombre comercial de la tienda');

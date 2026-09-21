-- WhatsApp de la tienda para que el catálogo público y el login del portal de
-- clientes puedan mostrar un enlace de contacto (recuperar acceso, dudas, etc.).
-- Vacío por defecto: el admin lo completa desde Configuración; si queda vacío,
-- el frontend simplemente no muestra el enlace (ver CatalogController.storeInfo).
INSERT INTO settings (setting_key, setting_value, data_type, category, description) VALUES
 ('STORE_WHATSAPP', '', 'STRING', 'GENERAL', 'WhatsApp de contacto de la tienda (con código de país, ej. 51999888777) — se muestra en el catálogo público y el login del portal de clientes');

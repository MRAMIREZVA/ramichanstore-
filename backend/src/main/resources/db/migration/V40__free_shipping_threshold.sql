-- Umbral de "envío gratis desde S/X" para el catálogo público (Fase 44) — vacío por
-- defecto: el admin lo completa desde Configuración; si queda vacío, el catálogo
-- simplemente no muestra el banner (ver CatalogService.getStoreInfo).
INSERT INTO settings (setting_key, setting_value, data_type, category, description) VALUES
 ('FREE_SHIPPING_THRESHOLD', '', 'NUMBER', 'GENERAL', 'Monto mínimo de compra (S/) para envío gratis, mostrado como banner en el catálogo público — vacío desactiva el banner');

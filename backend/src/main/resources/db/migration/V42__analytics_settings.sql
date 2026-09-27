-- Google Analytics / Meta Pixel para el catálogo público (pedido explícito del dueño:
-- "cero visibilidad de tráfico/conversión hoy"). Vacíos por defecto: el admin los completa
-- desde Configuración con su propio Measurement ID (GA4, "G-XXXXXXX") / Pixel ID de Meta
-- — mientras estén vacíos, el frontend simplemente no inyecta ningún script de tracking
-- (mismo criterio que STORE_WHATSAPP, V14).
INSERT INTO settings (setting_key, setting_value, data_type, category, description) VALUES
 ('GOOGLE_ANALYTICS_ID', '', 'STRING', 'GENERAL', 'Measurement ID de Google Analytics 4 (ej. G-XXXXXXXXXX) — activa el seguimiento de visitas en el catálogo público. Vacío = desactivado.'),
 ('META_PIXEL_ID', '', 'STRING', 'GENERAL', 'ID del Meta Pixel (Facebook/Instagram Ads) — activa el seguimiento de conversiones en el catálogo público. Vacío = desactivado.');

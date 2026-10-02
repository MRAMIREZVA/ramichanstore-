-- Fase 76: "Quiénes somos" + redes sociales en la parte superior del catálogo público.
-- Mismo criterio que STORE_WHATSAPP/FREE_SHIPPING_THRESHOLD/YAPE_NUMBER: settings nuevos,
-- la mayoría vacíos por defecto (el frontend oculta lo que no esté configurado — nunca un
-- link roto ni un ícono sin destino). STORE_ABOUT_US SÍ arranca con un texto real (editable
-- después desde Configuración sin volver a tocar código ni desplegar) para que el bloque no
-- nazca vacío en producción.
INSERT INTO settings (setting_key, setting_value, data_type, category, description)
VALUES
    ('STORE_ABOUT_US',
     N'Somos RamichanStore, una tienda peruana dedicada a figuras y coleccionables de anime. Trabajamos con preventas y traemos pedidos directamente desde Japón para que encuentres esa pieza que buscas. Escríbenos por WhatsApp o síguenos en redes — nos encanta hablar de anime tanto como a ti.',
     'STRING', 'GENERAL', 'Texto de "Quiénes somos" mostrado en el catálogo público'),
    ('STORE_FACEBOOK_URL', '', 'STRING', 'GENERAL', 'URL de la página de Facebook (vacío = no se muestra el ícono)'),
    ('STORE_INSTAGRAM_URL', '', 'STRING', 'GENERAL', 'URL del perfil de Instagram (vacío = no se muestra el ícono)'),
    ('STORE_TIKTOK_URL', '', 'STRING', 'GENERAL', 'URL del perfil de TikTok (vacío = no se muestra el ícono)'),
    ('STORE_YOUTUBE_URL', '', 'STRING', 'GENERAL', 'URL del canal de YouTube (vacío = no se muestra el ícono)');

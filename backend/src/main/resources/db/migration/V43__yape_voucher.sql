-- ============================================================
-- RamichanStore - V43: pago con Yape por comprobante (Fase 52).
--
-- Izipay no ofrece Yape para esta cuenta (verificado decodificando su formToken,
-- ver Fase 51), y las pasarelas que sí lo tienen exigen afiliación comercial con
-- comisión por venta. Mientras tanto: el cliente yapea al número de la tienda y
-- sube la captura del pago junto a su pedido web; el admin la ve y aprueba.
-- Sin pasarela, sin comisión, sin trámite.
-- ============================================================

-- Datos a los que el cliente le yapea. Vacíos por defecto: mientras el admin no los
-- complete desde Configuración, el checkout no ofrece esta opción y Yape sigue
-- coordinándose por WhatsApp como hasta ahora (mismo criterio que STORE_WHATSAPP, V14).
INSERT INTO settings (setting_key, setting_value, data_type, category, description) VALUES
 ('YAPE_NUMBER', '', 'STRING', 'GENERAL', 'Número de Yape de la tienda al que el cliente paga desde el checkout (9 dígitos) — vacío desactiva el pago por comprobante y Yape se sigue coordinando por WhatsApp'),
 ('YAPE_HOLDER_NAME', '', 'STRING', 'GENERAL', 'Nombre del titular que le aparece al cliente al yapear, para que confirme que es la cuenta correcta antes de pagar');
GO

-- La captura del pago va como columnas directas en order_requests (binario en BD,
-- mismo patrón que shipment_items.image_data en V23): es UNA imagen por pedido, no
-- una galería, así que no justifica una tabla hija.
ALTER TABLE order_requests ADD
    payment_voucher_file_name    NVARCHAR(255)  NULL,
    payment_voucher_content_type NVARCHAR(100)  NULL,
    payment_voucher_data         VARBINARY(MAX) NULL,
    payment_voucher_uploaded_at  DATETIME2      NULL;

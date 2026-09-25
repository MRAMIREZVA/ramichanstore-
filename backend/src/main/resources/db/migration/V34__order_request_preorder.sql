-- Permite que un pedido web (Fase 18) sea de tipo PREORDER, no solo STOCK: el
-- carrito público ahora puede mezclar productos en preventa con productos en
-- stock (bloqueo quitado en el frontend), y al hacer checkout se envían como
-- 2 pedidos web separados y homogéneos (uno STOCK, uno PREORDER) — ver
-- OrderRequestService.submit. Cada uno se convierte distinto: STOCK -> Sale
-- (como siempre), PREORDER -> una o más reservas (PreorderCustomer) nuevas.

ALTER TABLE order_requests ADD request_type NVARCHAR(20) NOT NULL CONSTRAINT DF_order_requests_type DEFAULT 'STOCK';
GO

ALTER TABLE order_requests ADD CONSTRAINT CK_order_requests_type CHECK (request_type IN ('STOCK', 'PREORDER'));
GO

-- Campaña de preventa resuelta al momento del submit (snapshot, igual criterio que
-- unit_price) — así el admin no tiene que volver a buscarla al convertir, y si la
-- campaña deja de estar activa entre el submit y la conversión, el dato ya quedó fijo.
ALTER TABLE order_request_items ADD preorder_id BIGINT NULL;
GO

ALTER TABLE order_request_items ADD CONSTRAINT FK_order_request_items_preorder
    FOREIGN KEY (preorder_id) REFERENCES preorders(id);
GO

CREATE INDEX IX_order_request_items_preorder_id ON order_request_items(preorder_id);
GO

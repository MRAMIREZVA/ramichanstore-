-- Fase 75: el rol VENDEDOR (sembrado como "Rol de prueba") tenia un permiso sin sentido
-- operativo real (solo AUDIT_VIEW + CUSTOMER_CREATE -- podia ver TODA la auditoria del
-- sistema pero no podia ver ni crear ventas, ni siquiera ver un cliente). Hallazgo de la
-- Fase 70 (auditoria de 3 agentes en paralelo), corregido ahora: un set de permisos real
-- de "vendedor de mostrador" -- ver/crear ventas y preventas, gestionar clientes y pedidos
-- web, agendar entregas, consultar stock/puntos -- sin tocar nada administrativo (Usuarios,
-- Roles, Configuracion, Embarques, Auditoria, Reportes financieros, cancelar ventas o
-- ajustar puntos manualmente). Ajustable despues desde la propia UI "Usuarios y Permisos"
-- sin volver a tocar codigo.
DELETE FROM role_permissions
WHERE role_id = (SELECT id FROM roles WHERE name = 'VENDEDOR');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'VENDEDOR'
  AND p.code IN (
    'DASHBOARD_VIEW',
    'PRODUCT_VIEW',
    'INVENTORY_VIEW',
    'CUSTOMER_VIEW', 'CUSTOMER_CREATE', 'CUSTOMER_EDIT',
    'SALE_VIEW', 'SALE_CREATE',
    'PREORDER_VIEW', 'PREORDER_CREATE',
    'DELIVERY_VIEW', 'DELIVERY_CREATE', 'DELIVERY_EDIT',
    'LOYALTY_VIEW',
    'ORDER_REQUEST_VIEW', 'ORDER_REQUEST_MANAGE'
  );

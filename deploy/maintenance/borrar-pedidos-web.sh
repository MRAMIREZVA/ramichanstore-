#!/bin/bash
# ============================================================
# RamichanStore - borra (oculta) pedidos web de prueba. Mismo
# mecanismo que usa el botón "Eliminar" en el resto del admin
# (deleted_at) -- reversible con restaurar.sh si hiciera falta,
# nunca un DELETE físico.
#
# OJO: si un pedido ya fue convertido a una venta real
# (converted_sale_id no vacío), este script NO toca esa venta -- solo
# el pedido web desaparece de la lista. Si esa venta también es de
# prueba y quieres que desaparezca, usa borrar-ventas.sh aparte
# (primero tiene que estar Cancelada).
#
# Uso:
#   ./borrar-pedidos-web.sh 5 6 7      -> borra esos ids
#   ./borrar-pedidos-web.sh --todos    -> borra TODOS los que sigan visibles
# ============================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_common.sh"

# Con prefijo "o." desde el inicio -- se reutiliza tal cual en la consulta
# de abajo que hace JOIN con sales, y ahí "id"/"deleted_at" sin prefijo
# serían ambiguos (las dos tablas tienen columnas con esos mismos nombres).
if [ "${1:-}" = "--todos" ]; then
  WHERE_CLAUSE="o.deleted_at IS NULL"
  DESCRIPCION="TODOS los pedidos web visibles"
else
  validar_ids "$@"
  IDS=$(lista_ids "$@")
  WHERE_CLAUSE="o.id IN ($IDS) AND o.deleted_at IS NULL"
  DESCRIPCION="los pedidos web: $IDS"
fi

echo "Esto es lo que se va a borrar:"
sql "SELECT o.id, o.status, o.guest_name, o.guest_phone, o.converted_sale_id FROM order_requests o WHERE $WHERE_CLAUSE ORDER BY o.id;"

echo
echo "De esos, los que ya se convirtieron a una venta real que sigue viva"
echo "(este script NO la toca -- usa borrar-ventas.sh aparte si también quieres borrarla):"
sql "SELECT o.id AS pedido_web_id, o.converted_sale_id AS venta_id, s.payment_status AS estado_de_la_venta
     FROM order_requests o JOIN sales s ON s.id = o.converted_sale_id
     WHERE $WHERE_CLAUSE AND o.converted_sale_id IS NOT NULL AND s.deleted_at IS NULL;"

confirmar "¿Borrar $DESCRIPCION?"

sql "UPDATE o SET deleted_at = SYSUTCDATETIME(), updated_by = 'mantenimiento' FROM order_requests o WHERE $WHERE_CLAUSE;"
echo "Listo."

#!/bin/bash
# ============================================================
# RamichanStore - lista los pedidos web (carrito del catálogo público,
# tab "Pedidos web" dentro de Pedidos) para revisar cuáles son de
# prueba antes de borrarlos con borrar-pedidos-web.sh.
#
# Uso:
#   ./listar-pedidos-web.sh                    -> solo los que siguen visibles
#   ./listar-pedidos-web.sh --incluir-borrados -> también los ya borrados
# ============================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_common.sh"

FILTRO="AND deleted_at IS NULL"
if [ "${1:-}" = "--incluir-borrados" ]; then
  FILTRO=""
fi

sql "
SELECT id, status, guest_name, guest_phone, converted_sale_id,
       CONVERT(varchar, created_at, 120) AS creado,
       CASE WHEN deleted_at IS NULL THEN 'visible' ELSE 'borrado' END AS estado_borrado
FROM order_requests
WHERE 1=1 $FILTRO
ORDER BY id;
"

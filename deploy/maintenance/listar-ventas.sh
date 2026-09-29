#!/bin/bash
# ============================================================
# RamichanStore - lista las últimas ventas/separaciones (todas viven
# en la tabla "sales" desde la Fase 40, discriminadas por tipo), para
# encontrar las de prueba antes de borrarlas con borrar-ventas.sh.
#
# Uso:
#   ./listar-ventas.sh                -> últimas 50 ventas visibles
#   ./listar-ventas.sh "Mauricio"     -> filtra por nombre de cliente (parcial)
# ============================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_common.sh"

FILTRO_CLIENTE=""
if [ -n "${1:-}" ]; then
  # Escapa comillas simples para que un nombre con apóstrofe no rompa el SQL.
  NOMBRE=${1//\'/\'\'}
  FILTRO_CLIENTE="AND c.full_name LIKE '%${NOMBRE}%'"
fi

sql "
SELECT TOP 50 s.id, c.full_name AS cliente, s.sale_type AS tipo, s.total, s.payment_status AS estado,
       CONVERT(varchar, s.sale_date, 23) AS fecha,
       (SELECT o.id FROM order_requests o WHERE o.converted_sale_id = s.id) AS pedido_web_origen
FROM sales s LEFT JOIN customers c ON c.id = s.customer_id
WHERE s.deleted_at IS NULL $FILTRO_CLIENTE
ORDER BY s.id DESC;
"

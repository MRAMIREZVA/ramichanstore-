#!/bin/bash
# ============================================================
# RamichanStore - revisa si un cliente se puede borrar sin romper
# nada, ANTES de intentarlo. Repite exactamente las mismas
# validaciones que ya tiene CustomerService.delete() en el backend
# (Fase 37): un cliente con ventas activas, movimientos de puntos,
# entregas o reservas de preventa NO se puede borrar de forma segura.
#
# El caso de los movimientos de puntos es el más delicado: son un
# historial que NUNCA se edita ni se borra (ledger), y la pantalla de
# Puntos necesita leer el nombre del cliente de cada movimiento para
# mostrarlo -- si el cliente ya está borrado, esa lectura revienta la
# pantalla completa apenas alguien la abra. No hay forma de "forzar"
# el borrado en este caso (ver borrar-cliente.sh).
#
# Uso:
#   ./verificar-cliente.sh 195
# ============================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_common.sh"

if [ "$#" -ne 1 ]; then
  echo "Uso: ./verificar-cliente.sh <id>  (un cliente a la vez)" >&2
  exit 1
fi
validar_ids "$@"
ID="$1"

echo "Cliente:"
sql "SELECT id, full_name, document_number, phone, notes FROM customers WHERE id = $ID;"

VENTAS=$(sql_scalar "SELECT COUNT(*) FROM sales WHERE customer_id = $ID AND deleted_at IS NULL;")
PUNTOS=$(sql_scalar "SELECT COUNT(*) FROM loyalty_point_movements WHERE customer_id = $ID;")
ENTREGAS=$(sql_scalar "SELECT COUNT(*) FROM deliveries WHERE customer_id = $ID AND deleted_at IS NULL;")
PREVENTAS=$(sql_scalar "SELECT COUNT(*) FROM preorder_customers WHERE customer_id = $ID AND deleted_at IS NULL;")

echo
echo "Ventas/separaciones activas ...... $VENTAS"
echo "Movimientos de puntos (histórico) . $PUNTOS"
echo "Entregas activas .................. $ENTREGAS"
echo "Reservas de preventa activas ...... $PREVENTAS"
echo

if [ "$VENTAS" = "0" ] && [ "$PUNTOS" = "0" ] && [ "$ENTREGAS" = "0" ] && [ "$PREVENTAS" = "0" ]; then
  echo "Seguro para borrar -- no tiene ningún registro relacionado."
  exit 0
fi

echo "NO se puede borrar de forma segura. Motivo(s):"
[ "$VENTAS" != "0" ] && echo "  - Tiene $VENTAS venta(s)/separación(es) activa(s). Bórralas primero con borrar-ventas.sh (deben estar Canceladas)."
[ "$PUNTOS" != "0" ] && echo "  - Tiene $PUNTOS movimiento(s) de puntos. Es un historial que nunca se borra -- mientras existan, este cliente no se puede borrar."
[ "$ENTREGAS" != "0" ] && echo "  - Tiene $ENTREGAS entrega(s) activa(s)."
[ "$PREVENTAS" != "0" ] && echo "  - Tiene $PREVENTAS reserva(s) de preventa activa(s)."
exit 1

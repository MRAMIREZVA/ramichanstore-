#!/bin/bash
# ============================================================
# RamichanStore - borra (oculta) ventas/separaciones de prueba. Mismo
# mecanismo que "Eliminar" en el resto del admin (deleted_at),
# reversible con restaurar.sh -- nunca un DELETE físico.
#
# IMPORTANTE, no se puede saltar: este script solo borra ventas que YA
# estén Canceladas. Si alguna sigue activa (Pendiente/Pagado/Parcial),
# el script se niega y no borra nada -- primero hay que cancelarla de
# verdad desde el propio admin (Pedidos -> Ventas -> abrir la venta ->
# "Cancelar venta"), porque solo esa acción revierte el stock y los
# puntos de fidelidad correctamente. Borrar una venta activa a la
# fuerza dejaría el stock y los puntos del cliente desincronizados
# para siempre, sin ningún aviso.
#
# Uso:
#   ./borrar-ventas.sh 3 4
# ============================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_common.sh"

validar_ids "$@"
IDS=$(lista_ids "$@")

echo "Estado actual de esas ventas:"
sql "SELECT id, payment_status AS estado, sale_type AS tipo, total FROM sales WHERE id IN ($IDS) AND deleted_at IS NULL ORDER BY id;"

NO_CANCELADAS=$(sql_scalar "SELECT COUNT(*) FROM sales WHERE id IN ($IDS) AND deleted_at IS NULL AND payment_status <> 'CANCELLED';")

if [ "$NO_CANCELADAS" != "0" ]; then
  echo
  echo "ERROR: hay $NO_CANCELADAS venta(s) en la lista que NO están Canceladas."
  echo "Cancélalas primero desde el admin (Pedidos -> Ventas -> Cancelar venta)"
  echo "-- eso revierte el stock y los puntos correctamente -- y vuelve a correr"
  echo "este script."
  exit 1
fi

confirmar "¿Borrar las ventas: $IDS (ya canceladas, no afecta stock ni puntos)?"

sql "UPDATE sales SET deleted_at = SYSUTCDATETIME(), updated_by = 'mantenimiento' WHERE id IN ($IDS) AND deleted_at IS NULL;"
echo "Listo."

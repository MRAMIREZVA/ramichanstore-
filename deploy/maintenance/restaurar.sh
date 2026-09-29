#!/bin/bash
# ============================================================
# RamichanStore - deshace un borrado hecho por cualquiera de los
# otros scripts de esta carpeta (o desde el propio admin). Como todo
# acá usa borrado lógico (deleted_at) y nunca un DELETE físico, esto
# siempre es posible.
#
# Uso:
#   ./restaurar.sh pedido-web 5 6 7
#   ./restaurar.sh venta 3 4
#   ./restaurar.sh cliente 195
# ============================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_common.sh"

TIPO="${1:-}"
if [ -n "$TIPO" ]; then
  shift
fi

case "$TIPO" in
  pedido-web) TABLA="order_requests" ;;
  venta)      TABLA="sales" ;;
  cliente)    TABLA="customers" ;;
  *)
    echo "Uso: ./restaurar.sh <pedido-web|venta|cliente> <id> [id...]" >&2
    exit 1
    ;;
esac

validar_ids "$@"
IDS=$(lista_ids "$@")

echo "Estado actual:"
sql "SELECT id, deleted_at FROM $TABLA WHERE id IN ($IDS) ORDER BY id;"

confirmar "¿Restaurar ($TIPO) los ids: $IDS?"

sql "UPDATE $TABLA SET deleted_at = NULL WHERE id IN ($IDS);"
echo "Listo."

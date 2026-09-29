#!/bin/bash
# ============================================================
# RamichanStore - borra (oculta) un cliente, solo si es seguro. Mismo
# mecanismo que "Eliminar" en el resto del admin (deleted_at),
# reversible con restaurar.sh.
#
# Corre las mismas validaciones que verificar-cliente.sh primero y se
# NIEGA a continuar si el cliente tiene algo relacionado -- a
# diferencia de borrar-ventas.sh, acá no existe forma de "forzar" el
# borrado: un cliente con movimientos de puntos rompe la pantalla de
# Puntos apenas se borra (ver verificar-cliente.sh para el detalle).
#
# Uso:
#   ./borrar-cliente.sh 195
# ============================================================
# Se calcula ANTES de sourcear _common.sh porque ese script hace "cd" a
# /root/ramichanstore -- si se calculara después, "$0"/BASH_SOURCE ya
# apuntaría relativo al lugar equivocado.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_common.sh"

if [ "$#" -ne 1 ]; then
  echo "Uso: ./borrar-cliente.sh <id>  (un cliente a la vez)" >&2
  exit 1
fi
ID="$1"

if ! "$SCRIPT_DIR/verificar-cliente.sh" "$ID"; then
  echo
  echo "No se borró nada -- corrige lo de arriba primero."
  exit 1
fi

confirmar "¿Borrar al cliente $ID?"

sql "UPDATE customers SET deleted_at = SYSUTCDATETIME(), updated_by = 'mantenimiento' WHERE id = $ID AND deleted_at IS NULL;"
echo "Listo."

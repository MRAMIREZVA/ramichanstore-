#!/bin/bash
# ============================================================
# RamichanStore - funciones compartidas por los scripts de esta carpeta
# (deploy/maintenance/). Cada script hace "source" de este archivo al
# principio -- este archivo no se corre solo.
#
# Mismo patrón que deploy/backup-db.sh: corre desde /root/ramichanstore
# (donde viven docker-compose.yml y .env) y saca la contraseña de sa
# del .env, nunca hardcodeada.
# ============================================================
set -euo pipefail

cd /root/ramichanstore

SA_PASSWORD=$(grep '^SA_PASSWORD=' .env | cut -d= -f2-)

# Corre un bloque de SQL contra RamichanStoreDB y muestra el resultado
# como tabla (igual que si lo tipearas en sqlcmd a mano).
# Uso: sql "SELECT ..."
sql() {
  # < /dev/null es a propósito: "docker compose exec -T" hereda la entrada
  # estándar del script aunque la consulta no la necesite (va toda en -Q), y
  # sin este corte se "come" el "si" que confirmar() espera leer más abajo
  # en el mismo script -- encontrado probando restaurar.sh de verdad.
  docker compose exec -T sqlserver /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -P "$SA_PASSWORD" -C -d RamichanStoreDB \
    -Q "SET QUOTED_IDENTIFIER ON; $1" < /dev/null
}

# Corre una consulta que devuelve UN solo valor (ej. un COUNT(*)) y lo
# entrega como texto plano, sin encabezados ni bordes de tabla -- para
# poder usarlo en un "if" de bash.
# Uso: N=$(sql_scalar "SELECT COUNT(*) FROM ...")
sql_scalar() {
  docker compose exec -T sqlserver /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -P "$SA_PASSWORD" -C -d RamichanStoreDB \
    -h -1 -W -Q "SET QUOTED_IDENTIFIER ON; SET NOCOUNT ON; $1" < /dev/null \
    | tr -d '[:space:]'
}

# Pide confirmación explícita antes de modificar datos reales.
# Uso: confirmar "¿Borrar tal cosa?"  -- corta el script si la
# respuesta no es exactamente "si".
confirmar() {
  echo
  read -r -p "$1 (escribe 'si' para continuar): " respuesta
  if [ "$respuesta" != "si" ]; then
    echo "Cancelado -- no se modificó nada."
    exit 1
  fi
}

# Valida que todos los argumentos recibidos sean números enteros
# positivos (ids de fila). Corta el script con un mensaje claro si
# alguno no lo es, en vez de dejar que sqlcmd falle con un error críptico.
validar_ids() {
  if [ "$#" -eq 0 ]; then
    echo "Error: hay que indicar al menos un id." >&2
    exit 1
  fi
  for id in "$@"; do
    if ! [[ "$id" =~ ^[0-9]+$ ]]; then
      echo "Error: '$id' no es un id válido (tiene que ser un número, ej. 5)." >&2
      exit 1
    fi
  done
}

# Arma "1,2,3" a partir de los argumentos, listo para pegar dentro de
# un "IN (...)" de SQL.
lista_ids() {
  local IFS=,
  echo "$*"
}

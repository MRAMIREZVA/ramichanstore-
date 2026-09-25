#!/bin/bash
# ============================================================
# RamichanStore - Backup diario de RamichanStoreDB, subido a
# DigitalOcean Spaces (almacenamiento externo al servidor).
#
# Requiere:
#   - s3cmd instalado y configurado en /root/.s3cfg (credenciales
#     de Spaces, NO versionadas — ver deploy/DEPLOYMENT.md)
#   - Corre desde /root/ramichanstore (donde vive docker-compose.yml y .env)
#
# Programado por cron para correr una vez al día (ver crontab -l).
# No borra backups viejos del Space a propósito: 250GB incluidos en el
# plan de Spaces es muchísimo más de lo que esta base de datos va a
# pesar en años, así que no vale la pena el riesgo de un script de
# borrado automático con un bug que elimine algo que sí se necesitaba.
# Revisar el tamaño del bucket de vez en cuando es suficiente.
# ============================================================
set -euo pipefail

cd /root/ramichanstore

DATE=$(date +%F_%H%M%S)
BACKUP_FILE="ramichanstore_${DATE}.bak"
CONTAINER_BACKUP_DIR="/var/opt/mssql/backup"
LOCAL_TMP_DIR="/root/db-backups-tmp"
SPACE_BUCKET="ramichanstore-backups"

# healthchecks.io ("dead man's switch"): si este script no avisa que terminó
# bien una vez al día, healthchecks.io manda un correo de alerta solo. Así
# nos enteramos si el backup falla o si el cron simplemente no corrió, sin
# tener que revisar el log a mano. Ver deploy/DEPLOYMENT.md.
HC_PING_URL="https://hc-ping.com/dd077059-1a7a-4ed9-8321-4a4f86781967"
# Si cualquier paso de abajo falla (set -e), avisa a healthchecks.io antes de salir.
trap 'curl -fsS --retry 3 -m 10 "${HC_PING_URL}/fail" >/dev/null 2>&1 || true' ERR

mkdir -p "$LOCAL_TMP_DIR"

SA_PASSWORD=$(grep '^SA_PASSWORD=' .env | cut -d= -f2-)

docker compose exec -T sqlserver mkdir -p "$CONTAINER_BACKUP_DIR"

docker compose exec -T sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "$SA_PASSWORD" -C \
  -Q "BACKUP DATABASE RamichanStoreDB TO DISK = '${CONTAINER_BACKUP_DIR}/${BACKUP_FILE}' WITH COMPRESSION"

docker compose cp "sqlserver:${CONTAINER_BACKUP_DIR}/${BACKUP_FILE}" "${LOCAL_TMP_DIR}/${BACKUP_FILE}"

s3cmd put "${LOCAL_TMP_DIR}/${BACKUP_FILE}" "s3://${SPACE_BUCKET}/${BACKUP_FILE}"

# Limpieza: el .bak ya está a salvo en el Space, no hace falta guardarlo
# ni dentro del contenedor ni en el disco local del servidor.
docker compose exec -T sqlserver rm -f "${CONTAINER_BACKUP_DIR}/${BACKUP_FILE}"
rm -f "${LOCAL_TMP_DIR}/${BACKUP_FILE}"

echo "$(date '+%F %T') - Backup completado y subido: ${BACKUP_FILE}"

# Avisa a healthchecks.io que todo salió bien.
curl -fsS --retry 3 -m 10 "$HC_PING_URL" >/dev/null 2>&1 || true

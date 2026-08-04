#!/usr/bin/env sh
set -eu

APP_DIR="${RATEMET_APP_DIR:-/opt/emecworks/ratemet}"
ENV_FILE="${RATEMET_ENV_FILE:-/etc/emecworks/ratemet.env}"
BACKUP_DIR="${RATEMET_BACKUP_DIR:-/var/backups/emecworks/ratemet}"
RETENTION_DAYS="${RATEMET_BACKUP_RETENTION_DAYS:-14}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DESTINATION="${BACKUP_DIR}/${STAMP}"

if [ ! -r "$ENV_FILE" ]; then
    echo "Ratemet environment file is missing or unreadable: $ENV_FILE" >&2
    exit 1
fi

mkdir -p "$DESTINATION"
chmod 700 "$BACKUP_DIR" "$DESTINATION"

cd "$APP_DIR"
docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml exec -T db \
    pg_dump -U ratemet -d ratemet --format=custom --no-owner --no-acl \
    > "${DESTINATION}/ratemet.dump"

sha256sum "${DESTINATION}/ratemet.dump" > "${DESTINATION}/SHA256SUMS"
chmod 600 "${DESTINATION}/ratemet.dump" "${DESTINATION}/SHA256SUMS"

find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -name '????????T??????Z' \
    -mtime "+$RETENTION_DAYS" -exec rm -rf -- {} +

echo "Ratemet backup completed: $DESTINATION"

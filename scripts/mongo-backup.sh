#!/usr/bin/env bash
# Periodic MongoDB backup, run by the mongo-backup service in docker-compose.yml.
# Writes gzipped mongodump archives to /backups and deletes ones older than the retention period.
#
# Restore an archive:
#   docker compose exec -T mongodb mongorestore --uri "mongodb://USER:PASS@localhost:27017/?authSource=admin" \
#     --gzip --archive --drop < backups/jolly-YYYY-MM-DD-HHMMSS.archive.gz
set -euo pipefail

: "${MONGODB_URI:?MONGODB_URI is required}"
INTERVAL_SECONDS="${BACKUP_INTERVAL_SECONDS:-86400}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"

mkdir -p "$BACKUP_DIR"

while true; do
    file="$BACKUP_DIR/jolly-$(date +%Y-%m-%d-%H%M%S).archive.gz"
    if mongodump --uri "$MONGODB_URI" --gzip --archive="$file.partial" --quiet; then
        # Rename only after a complete dump, so a failed run never looks like a valid backup
        mv "$file.partial" "$file"
        echo "[backup] wrote $file ($(du -h "$file" | cut -f1))"
    else
        rm -f "$file.partial"
        echo "[backup] mongodump FAILED" >&2
    fi

    find "$BACKUP_DIR" -name 'jolly-*.archive.gz' -mtime +"$RETENTION_DAYS" -print -delete | sed 's/^/[backup] deleted old /'
    sleep "$INTERVAL_SECONDS"
done

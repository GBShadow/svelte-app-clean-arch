#!/bin/sh
set -e

/pb/pocketbase superuser upsert "$PB_ADMIN_EMAIL" "$PB_ADMIN_PASSWORD"

exec /pb/pocketbase serve --http=0.0.0.0:8090

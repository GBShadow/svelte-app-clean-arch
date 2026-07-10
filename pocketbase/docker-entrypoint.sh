#!/bin/sh
set -e

# Senhas presentes no .env.example. O painel /_/ escuta em 0.0.0.0:8090, então
# subir com uma delas entrega o admin a qualquer um que alcance a porta.
EXAMPLE_PASSWORD="changeme123456"

if [ -z "$PB_ADMIN_EMAIL" ] || [ -z "$PB_ADMIN_PASSWORD" ]; then
	echo "ERRO: PB_ADMIN_EMAIL e PB_ADMIN_PASSWORD são obrigatórios." >&2
	exit 1
fi

if [ "$ALLOW_INSECURE_ADMIN_PASSWORD" != "true" ]; then
	for var in PB_ADMIN_PASSWORD SEED_ADMIN_PASSWORD; do
		eval "value=\$$var"
		if [ "$value" = "$EXAMPLE_PASSWORD" ]; then
			echo "ERRO: $var ainda é a senha de exemplo do .env.example." >&2
			echo "Defina uma senha real no .env antes de subir este serviço." >&2
			echo "Para desenvolvimento local, use ALLOW_INSECURE_ADMIN_PASSWORD=true." >&2
			exit 1
		fi
	done
fi

/pb/pocketbase superuser upsert "$PB_ADMIN_EMAIL" "$PB_ADMIN_PASSWORD"

exec /pb/pocketbase serve --http=0.0.0.0:8090

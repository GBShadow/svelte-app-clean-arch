# Infraestrutura PocketBase

## Resumo

PocketBase rodando via Docker Compose como backend persistente do monorepo, com as coleções `auth` (tipo auth nativo) e `user` (tipo base) criadas por migrations versionadas, superusuário e conta de aplicação semeados automaticamente no boot. Base para as próximas specs (`pocketbase-auth`, `pocketbase-user-crud`, `pocketbase-todo-sharing`).

## App(s) afetado(s)

Nenhum app SvelteKit ainda consome o PocketBase — esta é só a camada de infraestrutura (spec [`pocketbase-auth`](../specs/pocketbase-auth.md) cobre a integração).

## Camadas alteradas

| Camada | Arquivos |
|--------|----------|
| Docker | `pocketbase/Dockerfile` |
| Entrypoint | `pocketbase/docker-entrypoint.sh` |
| Orquestração | `pocketbase/docker-compose.yml` |
| Schema | `pocketbase/pb_migrations/0001_create_auth_collection.js`, `0002_create_user_collection.js` |
| Seed | `pocketbase/pb_migrations/0003_seed_admin.js` |
| Monorepo | `package.json` (raiz) — scripts `backend:dev`/`backend:down` |
| Config | `.env.example` (raiz) |

## Fluxo (Ports & Adapters)

Não aplicável — infraestrutura pura, sem domínio/gateway/API/UI. Fluxo de boot do container:

```
docker compose up
  → build a partir de pocketbase/Dockerfile (Alpine + binário PocketBase v0.39.5)
  → docker-entrypoint.sh:
      1. pocketbase superuser upsert $PB_ADMIN_EMAIL $PB_ADMIN_PASSWORD   (idempotente)
      2. pocketbase serve --http=0.0.0.0:8090
         → aplica pb_migrations/ ainda não aplicadas (tracking interno evita duplicar)
```

## API (se houver)

API nativa do PocketBase (sem rotas próprias nesta spec):

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/health` | Health check |
| POST | `/api/collections/_superusers/auth-with-password` | Login do superusuário (painel `/_/`) |
| POST | `/api/collections/auth/auth-with-password` | Login de conta de aplicação (coleção `auth`) |
| GET | `/api/collections/user/records` | Lista registros de `user` (requer auth) |

## Como testar

```bash
cp .env.example .env   # ajustar senhas
pnpm backend:dev        # http://127.0.0.1:8090
```

Validação manual executada (sem `TodoMemoryGateway` — infraestrutura, não domínio Todo):

1. `curl http://127.0.0.1:18090/api/health` → `{"message":"API is healthy.","code":200,"data":{}}`
2. Login do superusuário via `_superusers/auth-with-password` com `PB_ADMIN_EMAIL`/`PB_ADMIN_PASSWORD` → sucesso
3. Login da conta seed via `auth/auth-with-password` com `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` → sucesso, `isAdmin: true`
4. `GET /api/collections/user/records` (autenticado) → 1 registro com o mesmo e-mail da conta seed
5. `docker restart` no container → superusuário re-upsertado sem erro, coleção `user` continua com 1 único registro (sem duplicar migrations/seed)

## Decisões de design

- Versão do binário PocketBase fixada via `ARG PB_VERSION=0.39.5` no Dockerfile — builds reprodutíveis, sem `latest`.
- `pocketbase superuser upsert` (em vez de `create`) no entrypoint: idempotente, seguro para reiniciar o container sem falhar na segunda execução.
- Migrations seguem a numeração sequencial pedida na spec (`0001`, `0002`, `0003`) em vez do padrão de timestamp do PocketBase — o runner do PocketBase ordena por nome de arquivo e rastreia as já aplicadas, então funciona igual.
- Segredos (`PB_ADMIN_*`, `SEED_ADMIN_*`) somente via variáveis de ambiente, lidas na migration de seed com `$os.getenv(...)` — nunca hardcoded.
- Volume nomeado `pb_data` (não bind mount) para persistir dados sem sujar o repositório com uma pasta local.
- Coleção `auth` sem regras de API explícitas (`listRule`/`viewRule`/etc.) nesta spec — ficam com o padrão do PocketBase (somente superusuário) até a spec `pocketbase-auth` definir as regras de acesso da aplicação.

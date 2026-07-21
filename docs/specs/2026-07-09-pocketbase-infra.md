# Infraestrutura PocketBase

Created: 2026-07-09


## Contexto

O projeto hoje não tem backend persistente real: cada app usa gateways em memória, HTTP contra rotas SvelteKit locais, ou remote functions. Para viabilizar autenticação e CRUD de usuário/todo com múltiplas listas por usuário, é necessário um backend com persistência, autenticação e regras de acesso — o [PocketBase](https://pocketbase.io/) cobre os três em um único binário.

Esta spec cobre **apenas a infraestrutura**: container, coleções do banco (schema) e o script para subir o backend localmente. Autenticação, CRUD de usuário e CRUD de todo são specs separadas que dependem desta.

## Objetivo

Ter o PocketBase rodando via Docker Compose, com as coleções `auth` e `user` já criadas por migration versionada, mais um script `pnpm` para subir o backend.

## Escopo

**Incluído:**

- Dockerfile do PocketBase (`pocketbase/Dockerfile`)
- `docker-compose.yml` para rodar o backend localmente
- Migrations versionadas (`pocketbase/pb_migrations/`) criando as coleções `auth` e `user`
- Migration de seed com uma conta inicial (admin) para primeiro login
- Script `pnpm backend:dev` / `pnpm backend:down` na raiz do monorepo
- `.env.example` com as variáveis necessárias

**Fora do escopo:**

- Integração do SvelteKit com o PocketBase (spec [`pocketbase-auth`](./2026-07-09-pocketbase-auth.md))
- Telas de CRUD de usuário (spec [`pocketbase-user-crud`](./2026-07-09-pocketbase-user-crud.md))
- Coleções de todo (spec [`pocketbase-todo-sharing`](./2026-07-09-pocketbase-todo-sharing.md))

## Requisitos funcionais

- RF1: `pnpm backend:dev` sobe o PocketBase via Docker Compose, escutando em `http://127.0.0.1:8090`.
- RF2: Ao subir pela primeira vez, o superusuário do PocketBase (painel `/_/`) é criado automaticamente a partir de `PB_ADMIN_EMAIL`/`PB_ADMIN_PASSWORD`.
- RF3: As coleções `auth` e `user` existem automaticamente após o boot, criadas por migration — sem passo manual no painel.
- RF4: Uma conta de aplicação (registro em `auth` + registro em `user`, mesmo e-mail) é semeada automaticamente a partir de `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`, com `isAdmin = true` em `auth`.
- RF5: Os dados do PocketBase persistem entre reinicializações do container (volume Docker).

## Requisitos não funcionais

- Versão do binário PocketBase fixada no Dockerfile (sem `latest`), para builds reprodutíveis.
- Migrations idempotentes (não recriam/duplicam coleções já existentes ao reiniciar).
- Segredos (senhas admin/seed) apenas via variáveis de ambiente — nunca hardcoded no Dockerfile ou committados.

## Critérios de aceite

- [ ] AC1: Dado o repositório clonado com um `.env` preenchido a partir do `.env.example`, quando rodo `pnpm backend:dev`, então o PocketBase sobe e responde em `http://127.0.0.1:8090/api/health`.
- [ ] AC2: Dado o PocketBase recém-subido pela primeira vez, quando acesso `/_/`, então consigo logar com `PB_ADMIN_EMAIL`/`PB_ADMIN_PASSWORD` e vejo as coleções `auth` e `user` já criadas com os campos especificados.
- [ ] AC3: Dado o PocketBase recém-subido, quando consulto a API de autenticação da coleção `auth` com `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`, então a autenticação é bem-sucedida e existe um registro correspondente em `user` (mesmo e-mail).
- [ ] AC4: Dado o container já rodando com dados, quando reinicio (`docker compose restart` ou `down`+`up` mantendo o volume), então os dados e coleções persistem sem duplicação de migrations.

## Design (infraestrutura)

| Camada | Mudança prevista |
|--------|-------------------|
| Docker | `pocketbase/Dockerfile` — imagem base `alpine`, download do binário PocketBase (versão fixa), `EXPOSE 8090` |
| Orquestração | `pocketbase/docker-compose.yml` — serviço `pocketbase`, volume nomeado `pb_data`, porta `8090:8090`, `env_file: ../.env` |
| Bootstrap | Entrypoint do container roda `pocketbase superuser upsert $PB_ADMIN_EMAIL $PB_ADMIN_PASSWORD` antes de `pocketbase serve --http=0.0.0.0:8090` |
| Schema | `pocketbase/pb_migrations/0001_create_auth_collection.js` — cria coleção `auth` (tipo `auth` nativo do PocketBase) com campo customizado `name` (text, required) e `isAdmin` (bool, default `false`), `mustChangePassword` (bool, default `false`), `passwordSetAt` (date, opcional) |
| Schema | `pocketbase/pb_migrations/0002_create_user_collection.js` — cria coleção `user` (tipo `base`) com `name` (text), `email` (email, unique), `jobTitle` (select, enum `senior\|mid\|junior\|intern`). Sem relação com `auth`. |
| Seed | `pocketbase/pb_migrations/0003_seed_admin.js` — cria 1 registro em `auth` (`SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`, `isAdmin = true`) + 1 registro correspondente em `user` (mesmo e-mail) |
| Monorepo | `package.json` (raiz) — scripts `backend:dev` (`docker compose -f pocketbase/docker-compose.yml up`) e `backend:down` (`docker compose -f pocketbase/docker-compose.yml down`) |
| Config | `.env.example` (raiz) — `PB_ADMIN_EMAIL`, `PB_ADMIN_PASSWORD`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090` |

## Contrato de API (se houver)

Nenhum endpoint próprio nesta spec — a API usada é a nativa do PocketBase (`/api/collections/auth/...`, `/api/collections/user/...`), consumida pelas specs seguintes.

## Alternativas consideradas

- **Imagem Docker oficial pronta (ex. `spectado/pocketbase`)** em vez de Dockerfile próprio: mais rápido de configurar, mas o pedido foi explicitamente por um Dockerfile próprio + docker-compose, o que também dá controle total sobre a versão do binário e o processo de bootstrap do superusuário/seed.
- **Definir coleções manualmente pelo painel `/_/`** em vez de migrations versionadas: mais simples no primeiro momento, mas não é reprodutível entre máquinas/CI e não fica versionado no git — rejeitado.

## Questões em aberto

- Nenhuma no momento.

## Links

- Jira (após aprovação da spec): `docs/workflow/2026-07-09-pocketbase-infra.jira.md`
- Feature doc (pós-implementação): `docs/features/2026-07-09-pocketbase-infra.md`
- PR: `docs/workflow/2026-07-09-pocketbase-infra.pr.md`
- Specs relacionadas: [`pocketbase-auth`](./2026-07-09-pocketbase-auth.md), [`pocketbase-user-crud`](./2026-07-09-pocketbase-user-crud.md), [`pocketbase-todo-sharing`](./2026-07-09-pocketbase-todo-sharing.md)

# API Rules do PocketBase

## Descrição

Regra para garantir que API Rules (`listRule`/`viewRule`/`createRule`/`updateRule`/`deleteRule`)
sejam seguras assumindo chamada direta à API do PocketBase, e não apenas checagens de autorização
em `+page.server.ts`. Uma rule baseada em posse/participação (ex.: `participants.id ?= @request.auth.id`)
decide **se** a requisição é aceita, não **quais campos** podem ser alterados.

## Quando usar

Sempre que criar ou revisar uma migration com `updateRule`/`deleteRule` (ou `createRule` que aceite
campos sensíveis) em `pocketbase/pb_migrations/`.

## Caso real (corrigido em `0014_restrict_chat_room_update_rule.js`)

`chat_rooms.updateRule` original: `created_by = @request.auth.id || participants.id ?= @request.auth.id`.
Qualquer participante (não só o criador) podia enviar um `PATCH` direto à API e sobrescrever
`participants`/`created_by`, se autopromovendo a criador da sala — IDOR com escalonamento de
privilégio, contornando por completo as checagens `isCreator`/`isParticipant` do SvelteKit (que só
protegem quem passa pela UI).

## Passos

1. Liste os actors possíveis para o registro (dono/criador, participante comum, admin) e o que cada
   um deveria poder alterar.
2. Pergunte: "se essa rule fosse chamada direto via API (curl, devtools), sem passar pelo app, o que
   ela permitiria?" Se a resposta inclui alterar campos que só uma checagem de aplicação deveria
   proteger, a rule está permissiva demais.
3. Corrija com uma das duas abordagens:
   - **Validação por campo na própria rule**, quando expressável (`@request.body.<campo>:changed = false`,
     `:each` para relações multi-valor) — ver `0007_restrict_self_update_fields.js`.
   - **Rule restrita ao actor mais privilegiado**, movendo a mutação legítima mais restrita (ex.:
     participante comum saindo de uma sala) para o cliente superusuário (`getAdminClient()`) no
     `+page.server.ts`, com autorização já validada em código antes da chamada.
4. Valide manualmente com uma chamada HTTP direta autenticada como o actor menos privilegiado,
   tentando alterar um campo vedado — deve falhar (`403`/`404`).

## Ver também

- `.cursor/rules/architecture/pocketbase-api-rules.mdc` — regra Cursor equivalente
- `.agents/skills/pocketbase-collections.md` — convenção de `created`/`updated`
- `pocketbase/pb_migrations/0007_restrict_self_update_fields.js` — exemplo de rule com validação por campo
- `pocketbase/pb_migrations/0014_restrict_chat_room_update_rule.js` — correção do caso real descrito acima
- `docs/features/2026-07-10-chat-realtime.md` — seção "Decisões de design" com o relato completo do incidente

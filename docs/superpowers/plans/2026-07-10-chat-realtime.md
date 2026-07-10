# Chat em Tempo Real com Avatar — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar salas de chat de texto em tempo real (1:1 e grupo) com avatar de usuário no app `apps/runes`, conforme `docs/specs/chat-realtime.md` e `docs/workflow/chat-realtime.jira.md`.

**Architecture:** Segue o padrão **real** do projeto (não o `.mdc` idealizado nem `packages/todo-domain`): mutações via `locals.pb` direto em `+page.server.ts` (como `todos`/`users`), autorização em funções puras testadas isoladamente (`chatRoomAccess.ts`, como `todoListAccess.ts`). A única peça genuinamente nova é a reatividade client-side: uma classe `.svelte.ts` (`ChatMessagesFeed`) que mescla o histórico carregado via SSR com eventos de uma subscription realtime do PocketBase SDK, aberta diretamente do browser (primeira vez neste projeto) autenticada com o token exposto pelo `load`.

**Tech Stack:** SvelteKit 2 + Svelte 5 (runes), PocketBase JS SDK 0.27, Zod 4, Vitest 4, Playwright.

## Global Constraints

- Código em inglês; textos de UI e erros em português (ver `.cursor/rules/architecture/language-convention.mdc`).
- Todo elemento interativo tem `data-testid` em kebab-case; formulários têm `novalidate` (ver `.cursor/rules/architecture/data-testid.mdc`).
- Toda coleção PocketBase nova tem `created`/`updated` autodate.
- Não editar migrations já aplicadas — sempre criar uma nova.
- `packages/todo-domain` (Gateway/HttpGateway/MemoryGateway) **não é usado** nesta feature — é resquício de uma versão anterior do projeto.
- Sem trailer de co-autoria em commits.
- Rodar `pnpm test` e `pnpm check` (dentro de `apps/runes`, ou via turbo na raiz) antes de considerar qualquer task validada.

---

## File Structure

```
pocketbase/pb_migrations/
  0011_create_chat_collections.js       (novo)
  0012_add_avatar_to_auth.js            (novo)
  0013_open_user_listing_for_authenticated.js (novo)

apps/runes/src/lib/
  server/authUser.ts                    (modificado: + avatar)
  server/chatRecord.ts                  (novo)
  server/authLookup.ts                  (novo)
  domain/chatRoomAccess.ts              (novo)
  domain/chatRoomAccess.test.ts         (novo)
  domain/ChatMessagesFeed.svelte.ts     (novo)
  domain/ChatMessagesFeed.test.ts       (novo)
  validation/chatSchemas.ts             (novo)
  validation/chatSchemas.test.ts        (novo)
  client/pocketbaseClient.ts            (novo)
  components/Avatar.svelte              (novo)
  appRegistry.ts                        (modificado: + entrada "Chat")

apps/runes/src/hooks.server.ts          (modificado: + avatar no locals.user)

apps/runes/src/routes/
  profile/+page.server.ts               (novo)
  profile/+page.svelte                  (novo)
  chat/+page.server.ts                  (novo)
  chat/+page.svelte                     (novo)
  chat/new/+page.server.ts              (novo)
  chat/new/+page.svelte                 (novo)
  chat/[roomId]/+page.server.ts         (novo)
  chat/[roomId]/+page.svelte            (novo)

apps/runes/e2e/
  cleanup.ts                            (modificado: + cleanupChatRoom)
  chat.spec.ts                          (novo)
```

---

### Task 1: Migration — coleções `chat_rooms` e `chat_messages`

**Files:**
- Create: `pocketbase/pb_migrations/0011_create_chat_collections.js`

**Interfaces:**
- Produces: coleções `chat_rooms` (`name`, `created_by`, `participants`, `created`, `updated`) e `chat_messages` (`room`, `sender`, `text`, `created`, `updated`), consumidas por todas as tasks seguintes que usam `locals.pb.collection('chat_rooms'|'chat_messages')`.

- [ ] **Step 1: Escrever a migration**

```js
migrate((app) => {
  const authCollection = app.findCollectionByNameOrId("auth")

  const roomsCollection = new Collection({
    type: "base",
    name: "chat_rooms",
    fields: [
      { type: "text", name: "name" },
      {
        type: "relation",
        name: "created_by",
        required: true,
        collectionId: authCollection.id,
        maxSelect: 1,
        cascadeDelete: false
      },
      {
        type: "relation",
        name: "participants",
        required: true,
        collectionId: authCollection.id,
        maxSelect: 999,
        cascadeDelete: false
      },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ],
    listRule: "participants.id ?= @request.auth.id",
    viewRule: "participants.id ?= @request.auth.id",
    createRule: "@request.auth.id != '' && @request.body.created_by = @request.auth.id",
    updateRule: "created_by = @request.auth.id || participants.id ?= @request.auth.id",
    deleteRule: "created_by = @request.auth.id"
  })
  app.save(roomsCollection)

  const messagesCollection = new Collection({
    type: "base",
    name: "chat_messages",
    fields: [
      {
        type: "relation",
        name: "room",
        required: true,
        collectionId: roomsCollection.id,
        maxSelect: 1,
        cascadeDelete: true
      },
      {
        type: "relation",
        name: "sender",
        required: true,
        collectionId: authCollection.id,
        maxSelect: 1,
        cascadeDelete: false
      },
      { type: "text", name: "text", required: true, max: 2000 },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ],
    listRule: "room.participants.id ?= @request.auth.id",
    viewRule: "room.participants.id ?= @request.auth.id",
    createRule: "room.participants.id ?= @request.auth.id && @request.body.sender = @request.auth.id",
    updateRule: null,
    deleteRule: null
  })
  app.save(messagesCollection)
}, (app) => {
  const messagesCollection = app.findCollectionByNameOrId("chat_messages")
  app.delete(messagesCollection)

  const roomsCollection = app.findCollectionByNameOrId("chat_rooms")
  app.delete(roomsCollection)
})
```

- [ ] **Step 2: Aplicar e verificar**

Run: `pnpm backend:reset`
Expected: log sem erros; PocketBase sobe e aplica todas as migrations, incluindo `0011`. Confirme abrindo `http://127.0.0.1:8090/_/` e vendo `chat_rooms`/`chat_messages` na lista de coleções.

- [ ] **Step 3: Commit**

```bash
git add pocketbase/pb_migrations/0011_create_chat_collections.js
git commit -m "feat(pocketbase): adicionar coleções chat_rooms e chat_messages"
```

---

### Task 2: Migration — avatar em `auth` e listagem de `user` para autenticados

**Files:**
- Create: `pocketbase/pb_migrations/0012_add_avatar_to_auth.js`
- Create: `pocketbase/pb_migrations/0013_open_user_listing_for_authenticated.js`

**Interfaces:**
- Produces: campo `avatar` na coleção `auth` (consumido por `hooks.server.ts`, `/profile`, `Avatar.svelte`); `user.listRule`/`viewRule` abertas (consumidas por `/chat/new`).

- [ ] **Step 1: Migration do avatar**

```js
migrate((app) => {
  const collection = app.findCollectionByNameOrId("auth")

  collection.fields.add(new Field({
    type: "file",
    name: "avatar",
    maxSelect: 1,
    maxSize: 2097152,
    mimeTypes: ["image/jpeg", "image/png", "image/webp"]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("auth")
  collection.fields.removeByName("avatar")
  return app.save(collection)
})
```

- [ ] **Step 2: Migration da listagem de `user`**

```js
migrate((app) => {
  const collection = app.findCollectionByNameOrId("user")
  collection.listRule = "@request.auth.id != ''"
  collection.viewRule = "@request.auth.id != ''"
  app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("user")
  const userSelfOrAdmin = "@request.auth.isAdmin = true || email = @request.auth.email"
  collection.listRule = userSelfOrAdmin
  collection.viewRule = userSelfOrAdmin
  app.save(collection)
})
```

- [ ] **Step 3: Aplicar e verificar**

Run: `pnpm backend:reset`
Expected: sem erros; no admin UI (`http://127.0.0.1:8090/_/`), a coleção `auth` tem o campo `avatar`, e a coleção `user` tem `List rule`/`View rule` = `@request.auth.id != ''`.

- [ ] **Step 4: Commit**

```bash
git add pocketbase/pb_migrations/0012_add_avatar_to_auth.js pocketbase/pb_migrations/0013_open_user_listing_for_authenticated.js
git commit -m "feat(pocketbase): adicionar avatar em auth e abrir listagem de user para autenticados"
```

---

### Task 3: `chatRoomAccess.ts` — autorização pura + transferência de criador

**Files:**
- Create: `apps/runes/src/lib/domain/chatRoomAccess.ts`
- Test: `apps/runes/src/lib/domain/chatRoomAccess.test.ts`

**Interfaces:**
- Produces: `ChatRoomAccessInfo = { createdBy: string; participantIds: string[] }`, `isParticipant(room, userId): boolean`, `isCreator(room, userId): boolean`, `nextCreatorAfter(participantIds: string[], leavingId: string): string | null`. Consumido por `/chat/[roomId]/+page.server.ts` (Task 11).

- [ ] **Step 1: Escrever os testes (falhando)**

```ts
import { describe, expect, test } from 'vitest';
import { isCreator, isParticipant, nextCreatorAfter } from './chatRoomAccess';

describe('isParticipant', () => {
	test('participante está na lista', () => {
		expect(isParticipant({ createdBy: 'u1', participantIds: ['u1', 'u2'] }, 'u2')).toBe(true);
	});

	test('não-participante não está na lista', () => {
		expect(isParticipant({ createdBy: 'u1', participantIds: ['u1', 'u2'] }, 'u3')).toBe(false);
	});
});

describe('isCreator', () => {
	test('criador é reconhecido', () => {
		expect(isCreator({ createdBy: 'u1', participantIds: ['u1', 'u2'] }, 'u1')).toBe(true);
	});

	test('não-criador não é reconhecido', () => {
		expect(isCreator({ createdBy: 'u1', participantIds: ['u1', 'u2'] }, 'u2')).toBe(false);
	});
});

describe('nextCreatorAfter', () => {
	test('transfere para o próximo mais antigo (primeiro do array restante)', () => {
		expect(nextCreatorAfter(['u1', 'u2', 'u3'], 'u1')).toBe('u2');
	});

	test('preserva ordem mesmo removendo do meio', () => {
		expect(nextCreatorAfter(['u1', 'u2', 'u3'], 'u2')).toBe('u1');
	});

	test('retorna null quando não sobra ninguém', () => {
		expect(nextCreatorAfter(['u1'], 'u1')).toBeNull();
	});
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `pnpm --filter runes test -- src/lib/domain/chatRoomAccess.test.ts`
Expected: FAIL com "Cannot find module './chatRoomAccess'" (ou similar).

- [ ] **Step 3: Implementar**

```ts
export type ChatRoomAccessInfo = {
	createdBy: string;
	participantIds: string[];
};

export function isParticipant(room: ChatRoomAccessInfo, userId: string): boolean {
	return room.participantIds.includes(userId);
}

export function isCreator(room: ChatRoomAccessInfo, userId: string): boolean {
	return room.createdBy === userId;
}

export function nextCreatorAfter(participantIds: string[], leavingId: string): string | null {
	const remaining = participantIds.filter((id) => id !== leavingId);
	return remaining[0] ?? null;
}
```

- [ ] **Step 4: Rodar e confirmar sucesso**

Run: `pnpm --filter runes test -- src/lib/domain/chatRoomAccess.test.ts`
Expected: PASS (7 testes).

- [ ] **Step 5: Commit**

```bash
git add apps/runes/src/lib/domain/chatRoomAccess.ts apps/runes/src/lib/domain/chatRoomAccess.test.ts
git commit -m "feat(runes): adicionar chatRoomAccess (autorização e transferência de criador)"
```

---

### Task 4: `chatSchemas.ts` — validação Zod

**Files:**
- Create: `apps/runes/src/lib/validation/chatSchemas.ts`
- Test: `apps/runes/src/lib/validation/chatSchemas.test.ts`

**Interfaces:**
- Produces: `createRoomSchema`, `sendMessageSchema`, `avatarSchema` (com `File`). Consumidos por `/chat/new`, `/chat/[roomId]`, `/profile`.

- [ ] **Step 1: Escrever os testes (falhando)**

```ts
import { describe, expect, test } from 'vitest';
import { avatarSchema, createRoomSchema, sendMessageSchema } from './chatSchemas';

describe('createRoomSchema', () => {
	test('aceita ao menos um participante, nome opcional', () => {
		const result = createRoomSchema.safeParse({ participantIds: ['a@x.com'] });
		expect(result.success).toBe(true);
	});

	test('rejeita sem participantes', () => {
		const result = createRoomSchema.safeParse({ participantIds: [] });
		expect(result.success).toBe(false);
	});
});

describe('sendMessageSchema', () => {
	test('aceita texto dentro do limite', () => {
		expect(sendMessageSchema.safeParse({ text: 'oi' }).success).toBe(true);
	});

	test('rejeita texto vazio', () => {
		expect(sendMessageSchema.safeParse({ text: '' }).success).toBe(false);
	});

	test('rejeita texto acima de 2000 caracteres', () => {
		expect(sendMessageSchema.safeParse({ text: 'a'.repeat(2001) }).success).toBe(false);
	});
});

describe('avatarSchema', () => {
	test('aceita imagem jpeg dentro do limite', () => {
		const file = new File(['x'], 'avatar.jpg', { type: 'image/jpeg' });
		expect(avatarSchema.safeParse(file).success).toBe(true);
	});

	test('rejeita formato inválido', () => {
		const file = new File(['x'], 'avatar.gif', { type: 'image/gif' });
		expect(avatarSchema.safeParse(file).success).toBe(false);
	});

	test('rejeita arquivo maior que 2MB', () => {
		const big = new Uint8Array(2 * 1024 * 1024 + 1);
		const file = new File([big], 'avatar.png', { type: 'image/png' });
		expect(avatarSchema.safeParse(file).success).toBe(false);
	});

	test('rejeita arquivo vazio', () => {
		const file = new File([], 'avatar.png', { type: 'image/png' });
		expect(avatarSchema.safeParse(file).success).toBe(false);
	});
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `pnpm --filter runes test -- src/lib/validation/chatSchemas.test.ts`
Expected: FAIL com "Cannot find module './chatSchemas'".

- [ ] **Step 3: Implementar**

```ts
import { z } from 'zod';

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const createRoomSchema = z.object({
	participantIds: z
		.array(z.string().min(1))
		.min(1, { error: 'Escolha pelo menos um participante.' }),
	name: z.string().optional()
});

export const sendMessageSchema = z.object({
	text: z
		.string()
		.min(1, { error: 'Mensagem obrigatória.' })
		.max(2000, { error: 'Mensagem muito longa (máx. 2000 caracteres).' })
});

export const avatarSchema = z
	.instanceof(File, { error: 'Selecione uma imagem.' })
	.refine((file) => file.size > 0, { error: 'Selecione uma imagem.' })
	.refine((file) => file.size <= MAX_AVATAR_SIZE, { error: 'A imagem deve ter no máximo 2MB.' })
	.refine((file) => ALLOWED_AVATAR_TYPES.includes(file.type), {
		error: 'Formato inválido. Use JPG, PNG ou WEBP.'
	});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
```

- [ ] **Step 4: Rodar e confirmar sucesso**

Run: `pnpm --filter runes test -- src/lib/validation/chatSchemas.test.ts`
Expected: PASS (9 testes).

- [ ] **Step 5: Commit**

```bash
git add apps/runes/src/lib/validation/chatSchemas.ts apps/runes/src/lib/validation/chatSchemas.test.ts
git commit -m "feat(runes): adicionar schemas de validação do chat (sala, mensagem, avatar)"
```

---

### Task 5: Types de servidor — `chatRecord.ts` e `authLookup.ts`

**Files:**
- Create: `apps/runes/src/lib/server/chatRecord.ts`
- Create: `apps/runes/src/lib/server/authLookup.ts`

**Interfaces:**
- Produces: `ChatRoomRecord`, `ChatMessageRecord`, `AuthParticipant` (types); `findAuthRecordByEmail(pb, email)`. Consumidos por todas as rotas de `/chat/*` e `/profile`.

- [ ] **Step 1: Criar os types**

```ts
export type AuthParticipant = {
	id: string;
	name: string;
	avatar: string;
};

export type ChatRoomRecord = {
	id: string;
	name: string;
	created_by: string;
	participants: string[];
	created: string;
	updated: string;
	expand?: {
		participants?: AuthParticipant[];
	};
};

export type ChatMessageRecord = {
	id: string;
	room: string;
	sender: string;
	text: string;
	created: string;
	updated: string;
	expand?: {
		sender?: AuthParticipant;
	};
};
```

- [ ] **Step 2: Criar o helper de lookup**

```ts
import type PocketBase from 'pocketbase';

export async function findAuthRecordByEmail(pb: PocketBase, email: string) {
	return pb.collection('auth').getFirstListItem(pb.filter('email = {:email}', { email }));
}
```

- [ ] **Step 3: Verificar tipos**

Run: `pnpm --filter runes check`
Expected: sem novos erros de tipo (esses arquivos ainda não são importados por ninguém).

- [ ] **Step 4: Commit**

```bash
git add apps/runes/src/lib/server/chatRecord.ts apps/runes/src/lib/server/authLookup.ts
git commit -m "feat(runes): adicionar types de chat e helper de lookup por e-mail em auth"
```

---

### Task 6: Expor `avatar` em `AuthenticatedUser`

**Files:**
- Modify: `apps/runes/src/lib/server/authUser.ts`
- Modify: `apps/runes/src/hooks.server.ts`

**Interfaces:**
- Consumes: campo `avatar` da coleção `auth` (Task 2).
- Produces: `AuthenticatedUser.avatar: string`, disponível em `locals.user.avatar` e, via `+layout.server.ts` (já expõe `locals.user`), em `data.user.avatar` no client.

- [ ] **Step 1: Adicionar o campo ao type**

Em `apps/runes/src/lib/server/authUser.ts`, adicionar `avatar: string;` ao final do type:

```ts
export type AuthenticatedUser = {
	id: string;
	name: string;
	email: string;
	jobTitle: string;
	isAdmin: boolean;
	mustChangePassword: boolean;
	passwordSetAt: string | null;
	avatar: string;
};
```

- [ ] **Step 2: Popular o campo em `hooks.server.ts`**

Em `apps/runes/src/hooks.server.ts`, dentro do bloco que monta `event.locals.user`, adicionar `avatar: authRecord.record.avatar ?? ''` ao objeto:

```ts
			event.locals.user = {
				id: profile.id,
				name: profile.name,
				email: profile.email,
				jobTitle: profile.jobTitle,
				isAdmin: authRecord.record.isAdmin,
				mustChangePassword: authRecord.record.mustChangePassword,
				passwordSetAt: authRecord.record.passwordSetAt || null,
				avatar: authRecord.record.avatar ?? ''
			} satisfies AuthenticatedUser;
```

- [ ] **Step 3: Verificar tipos**

Run: `pnpm --filter runes check`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add apps/runes/src/lib/server/authUser.ts apps/runes/src/hooks.server.ts
git commit -m "feat(runes): expor avatar em AuthenticatedUser"
```

---

### Task 7: `Avatar.svelte` — componente reutilizável

**Files:**
- Create: `apps/runes/src/lib/components/Avatar.svelte`

**Interfaces:**
- Consumes: `PUBLIC_POCKETBASE_URL` (já existe em `$env/static/public`).
- Produces: `<Avatar userId avatar name size? />`, usado por `/chat`, `/chat/[roomId]` e `/profile`.

- [ ] **Step 1: Implementar o componente**

```svelte
<script lang="ts">
	import { PUBLIC_POCKETBASE_URL } from '$env/static/public';

	let {
		userId,
		avatar,
		name,
		size = 'size-8'
	}: { userId: string; avatar: string; name: string; size?: string } = $props();

	const initials = $derived(
		name
			.trim()
			.split(/\s+/)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase() ?? '')
			.join('')
	);

	const src = $derived(
		avatar ? `${PUBLIC_POCKETBASE_URL}/api/files/auth/${userId}/${avatar}?thumb=64x64` : null
	);
</script>

{#if src}
	<img
		{src}
		alt={name}
		class="rounded-full object-cover {size}"
		data-testid="avatar-{userId}"
	/>
{:else}
	<div
		class="rounded-full bg-neutral text-neutral-content flex items-center justify-center font-mono {size}"
		data-testid="avatar-{userId}"
	>
		<span class="text-xs">{initials}</span>
	</div>
{/if}
```

- [ ] **Step 2: Verificar tipos**

Run: `pnpm --filter runes check`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add apps/runes/src/lib/components/Avatar.svelte
git commit -m "feat(runes): adicionar componente Avatar com placeholder de iniciais"
```

---

### Task 8: `/profile` — upload de avatar

**Files:**
- Create: `apps/runes/src/routes/profile/+page.server.ts`
- Create: `apps/runes/src/routes/profile/+page.svelte`

**Interfaces:**
- Consumes: `avatarSchema` (Task 4), `Avatar.svelte` (Task 7), `locals.pb`, `locals.user` (Task 6).
- Produces: rota `/profile` com action `uploadAvatar`.

- [ ] **Step 1: `+page.server.ts`**

```ts
import { fail } from '@sveltejs/kit';
import { ClientResponseError } from 'pocketbase';
import type { Actions, PageServerLoad } from './$types';
import { avatarSchema } from '$lib/validation/chatSchemas';

export const load: PageServerLoad = async ({ locals }) => {
	return { user: locals.user };
};

export const actions: Actions = {
	uploadAvatar: async ({ request, locals }) => {
		const formData = await request.formData();
		const file = formData.get('avatar');

		const parsed = avatarSchema.safeParse(file);
		if (!parsed.success) {
			const errors: Record<string, string> = {
				avatar: parsed.error.issues[0]?.message ?? 'Imagem inválida.'
			};
			return fail(400, { errors });
		}

		const userId = locals.pb.authStore.record?.id ?? '';
		try {
			await locals.pb.collection('auth').update(userId, { avatar: parsed.data });
		} catch (err) {
			if (err instanceof ClientResponseError) {
				return fail(400, { errors: { general: 'Não foi possível salvar o avatar.' } });
			}
			throw err;
		}

		return { success: true };
	}
};
```

- [ ] **Step 2: `+page.svelte`**

```svelte
<script lang="ts">
	import Avatar from '$lib/components/Avatar.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<div class="flex flex-col gap-4 max-w-md mx-auto w-full">
	<h1 class="text-2xl font-bold font-display">Meu perfil</h1>

	{#if form?.errors?.general}
		<div class="alert alert-error" role="alert" data-testid="error-general">{form.errors.general}</div>
	{/if}

	<div class="card bg-base-100 border border-base-300 shadow-sm">
		<div class="card-body gap-4 items-center">
			<Avatar
				userId={data.user?.id ?? ''}
				avatar={data.user?.avatar ?? ''}
				name={data.user?.name ?? ''}
				size="size-24"
			/>

			<form
				method="POST"
				action="?/uploadAvatar"
				enctype="multipart/form-data"
				novalidate
				class="flex flex-col gap-2 w-full"
				data-testid="avatar-form"
			>
				<input
					type="file"
					name="avatar"
					accept="image/jpeg,image/png,image/webp"
					data-testid="input-avatar"
					class="file-input file-input-bordered w-full"
				/>
				{#if form?.errors?.avatar}
					<span class="text-error text-sm" data-testid="error-avatar">{form.errors.avatar}</span>
				{/if}
				<button type="submit" class="btn btn-primary" data-testid="btn-upload-avatar">Salvar avatar</button>
			</form>
		</div>
	</div>
</div>
```

- [ ] **Step 3: Verificar manualmente**

Run: `pnpm dev:full` (backend + frontend), acesse `/profile`, envie uma imagem válida.
Expected: sem erro; ao recarregar, o avatar enviado aparece no lugar do placeholder de iniciais.

- [ ] **Step 4: Commit**

```bash
git add apps/runes/src/routes/profile
git commit -m "feat(runes): adicionar tela de perfil com upload de avatar"
```

---

### Task 9: `/chat` — listagem de salas

**Files:**
- Create: `apps/runes/src/routes/chat/+page.server.ts`
- Create: `apps/runes/src/routes/chat/+page.svelte`

**Interfaces:**
- Consumes: `ChatRoomRecord`, `ChatMessageRecord` (Task 5), `Avatar.svelte` (Task 7).
- Produces: rota `/chat` (`data.rooms: { room: ChatRoomRecord; lastMessage: ChatMessageRecord | null }[]`, `data.userId: string`).

- [ ] **Step 1: `+page.server.ts`**

```ts
import type { PageServerLoad } from './$types';
import type { ChatMessageRecord, ChatRoomRecord } from '$lib/server/chatRecord';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.pb.authStore.record?.id ?? '';

	const rooms = await locals.pb.collection('chat_rooms').getFullList<ChatRoomRecord>({
		filter: locals.pb.filter('participants.id ?= {:userId}', { userId }),
		expand: 'participants'
	});

	const roomsWithPreview = await Promise.all(
		rooms.map(async (room) => {
			const lastMessagePage = await locals.pb
				.collection('chat_messages')
				.getList<ChatMessageRecord>(1, 1, {
					filter: locals.pb.filter('room = {:roomId}', { roomId: room.id }),
					sort: '-created'
				});
			return { room, lastMessage: lastMessagePage.items[0] ?? null };
		})
	);

	roomsWithPreview.sort((a, b) => {
		const aTime = a.lastMessage?.created ?? a.room.created;
		const bTime = b.lastMessage?.created ?? b.room.created;
		return bTime.localeCompare(aTime);
	});

	return { rooms: roomsWithPreview, userId };
};
```

- [ ] **Step 2: `+page.svelte`**

```svelte
<script lang="ts">
	import Avatar from '$lib/components/Avatar.svelte';
	import IconPlus from '$lib/components/icons/IconPlus.svelte';
	import type { ChatRoomRecord } from '$lib/server/chatRecord';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	function otherParticipants(room: ChatRoomRecord) {
		return (room.expand?.participants ?? []).filter((p) => p.id !== data.userId);
	}

	function roomDisplayName(room: ChatRoomRecord): string {
		if (room.name) return room.name;
		const others = otherParticipants(room);
		return others.map((p) => p.name).join(', ') || 'Sala';
	}
</script>

<div class="flex flex-col gap-4 mx-auto w-full max-w-2xl">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold font-display">Chat</h1>
		<a href="/chat/new" class="btn btn-primary btn-sm gap-1.5" data-testid="btn-new-room">
			<IconPlus class="size-4" />
			Nova conversa
		</a>
	</div>

	{#if data.rooms.length === 0}
		<div class="empty-state">
			<div class="card-body">
				<p class="font-mono text-sm opacity-80" data-testid="no-rooms-msg">
					Ainda sem conversas. Crie a primeira acima.
				</p>
			</div>
		</div>
	{:else}
		<ul class="flex flex-col gap-2">
			{#each data.rooms as { room, lastMessage } (room.id)}
				{@const participant = otherParticipants(room)[0]}
				<li class="card bg-base-100 border border-base-300 shadow-sm" data-testid="room-item-{room.id}">
					<a href="/chat/{room.id}" class="card-body flex-row items-center gap-3 py-3" data-testid="room-link-{room.id}">
						{#if participant}
							<Avatar userId={participant.id} avatar={participant.avatar} name={participant.name} />
						{/if}
						<div class="flex-1 min-w-0">
							<p class="font-medium truncate">{roomDisplayName(room)}</p>
							{#if lastMessage}
								<p class="text-sm opacity-60 truncate" data-testid="room-preview-{room.id}">{lastMessage.text}</p>
							{/if}
						</div>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>
```

- [ ] **Step 3: Verificar manualmente**

Run: `pnpm dev:full`, acesse `/chat` autenticado.
Expected: mostra `no-rooms-msg` (ainda não há salas).

- [ ] **Step 4: Commit**

```bash
git add apps/runes/src/routes/chat/+page.server.ts apps/runes/src/routes/chat/+page.svelte
git commit -m "feat(runes): adicionar listagem de salas de chat"
```

---

### Task 10: `/chat/new` — criar sala

**Files:**
- Create: `apps/runes/src/routes/chat/new/+page.server.ts`
- Create: `apps/runes/src/routes/chat/new/+page.svelte`

**Interfaces:**
- Consumes: `createRoomSchema` (Task 4), `findAuthRecordByEmail` (Task 5), `fieldErrorsFrom` (existente em `$lib/validation/formErrors.ts`).
- Produces: rota `/chat/new`.

- [ ] **Step 1: `+page.server.ts`**

```ts
import { fail, redirect } from '@sveltejs/kit';
import { ClientResponseError } from 'pocketbase';
import type { Actions, PageServerLoad } from './$types';
import type { UserRecord } from '$lib/server/userRecord';
import type { ChatRoomRecord } from '$lib/server/chatRecord';
import { findAuthRecordByEmail } from '$lib/server/authLookup';
import { createRoomSchema } from '$lib/validation/chatSchemas';
import { fieldErrorsFrom } from '$lib/validation/formErrors';

export const load: PageServerLoad = async ({ locals }) => {
	const users = await locals.pb.collection('user').getFullList<UserRecord>({ sort: 'name' });
	return { users: users.filter((u) => u.email !== locals.user?.email) };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = createRoomSchema.safeParse({
			participantIds: formData.getAll('participantIds'),
			name: formData.get('name') || undefined
		});
		if (!parsed.success) {
			return fail(400, { errors: fieldErrorsFrom(parsed.error) });
		}

		const currentUserId = locals.pb.authStore.record?.id ?? '';

		let authIds: string[];
		try {
			const authRecords = await Promise.all(
				parsed.data.participantIds.map((email) => findAuthRecordByEmail(locals.pb, email))
			);
			authIds = authRecords.map((r) => r.id);
		} catch {
			const errors: Record<string, string> = {
				general: 'Não foi possível encontrar os participantes escolhidos.'
			};
			return fail(400, { errors });
		}

		let room: ChatRoomRecord;
		try {
			room = await locals.pb.collection('chat_rooms').create<ChatRoomRecord>({
				name: parsed.data.name ?? '',
				created_by: currentUserId,
				participants: [currentUserId, ...authIds]
			});
		} catch (err) {
			if (err instanceof ClientResponseError) {
				return fail(400, { errors: { general: 'Não foi possível criar a sala.' } });
			}
			throw err;
		}

		throw redirect(303, `/chat/${room.id}`);
	}
};
```

- [ ] **Step 2: `+page.svelte`**

```svelte
<script lang="ts">
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<div class="flex flex-col gap-4 max-w-xl mx-auto w-full">
	<h1 class="text-2xl font-bold font-display">Nova conversa</h1>

	{#if form?.errors?.general}
		<div class="alert alert-error" role="alert" data-testid="error-general">{form.errors.general}</div>
	{/if}

	<form method="POST" novalidate class="flex flex-col gap-4" data-testid="new-room-form">
		<label class="form-control">
			<span class="label-text">Nome da sala (opcional)</span>
			<input type="text" name="name" data-testid="input-room-name" class="input input-bordered w-full" />
		</label>

		<fieldset class="flex flex-col gap-2">
			<legend class="label-text mb-1">Participantes</legend>
			{#if data.users.length === 0}
				<p class="text-sm opacity-60" data-testid="no-users-msg">Nenhum outro usuário disponível.</p>
			{/if}
			{#each data.users as user (user.id)}
				<label class="flex items-center gap-2" data-testid="participant-option-{user.id}">
					<input
						type="checkbox"
						name="participantIds"
						value={user.email}
						class="checkbox"
						data-testid="checkbox-participant-{user.id}"
					/>
					<span>{user.name} <span class="opacity-60 text-sm">({user.email})</span></span>
				</label>
			{/each}
			{#if form?.errors?.participantIds}
				<span class="text-error text-sm" data-testid="error-participant-ids">{form.errors.participantIds}</span>
			{/if}
		</fieldset>

		<button type="submit" class="btn btn-primary w-fit" data-testid="btn-create-room">Criar sala</button>
	</form>
</div>
```

- [ ] **Step 3: Verificar manualmente**

Run: `pnpm dev:full`, acesse `/chat/new` com um usuário não-admin.
Expected: lista de outros usuários aparece (confirma que a migration da Task 2 abriu a listagem); criar sala redireciona para `/chat/{id}` (404 esperado até a Task 11).

- [ ] **Step 4: Commit**

```bash
git add apps/runes/src/routes/chat/new
git commit -m "feat(runes): adicionar criação de sala de chat"
```

---

### Task 11: `pocketbaseClient.ts` — factory client-side autenticado

**Files:**
- Create: `apps/runes/src/lib/client/pocketbaseClient.ts`

**Interfaces:**
- Produces: `createBrowserClient(token: string, record: RecordModel | null): PocketBase`. Consumido pela Task 13 (`/chat/[roomId]/+page.svelte`).

- [ ] **Step 1: Implementar**

```ts
import PocketBase, { type RecordModel } from 'pocketbase';
import { PUBLIC_POCKETBASE_URL } from '$env/static/public';

export function createBrowserClient(token: string, record: RecordModel | null): PocketBase {
	const pb = new PocketBase(PUBLIC_POCKETBASE_URL);
	pb.authStore.save(token, record);
	return pb;
}
```

- [ ] **Step 2: Verificar tipos**

Run: `pnpm --filter runes check`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add apps/runes/src/lib/client/pocketbaseClient.ts
git commit -m "feat(runes): adicionar factory de PocketBase client-side autenticado"
```

---

### Task 12: `ChatMessagesFeed.svelte.ts` — domínio reativo com dedup

**Files:**
- Create: `apps/runes/src/lib/domain/ChatMessagesFeed.svelte.ts`
- Test: `apps/runes/src/lib/domain/ChatMessagesFeed.test.ts`

**Interfaces:**
- Consumes: `type ChatMessageRecord` de `$lib/server/chatRecord` (import type-only).
- Produces: `class ChatMessagesFeed`, `type ChatMessageSubscribe = (roomId: string, onMessage: (m: ChatMessageRecord) => void) => () => void`. Consumido pela Task 13.

- [ ] **Step 1: Escrever os testes (falhando)**

```ts
import { describe, expect, test, vi } from 'vitest';
import { ChatMessagesFeed } from './ChatMessagesFeed.svelte';
import type { ChatMessageRecord } from '$lib/server/chatRecord';

function makeMessage(id: string, text: string): ChatMessageRecord {
	return { id, room: 'room-1', sender: 'user-1', text, created: id, updated: id };
}

describe('ChatMessagesFeed', () => {
	test('inicia com as mensagens carregadas via load', () => {
		const initial = [makeMessage('m1', 'oi')];
		const feed = new ChatMessagesFeed('room-1', initial, () => () => {});
		expect(feed.messages).toEqual(initial);
	});

	test('adiciona mensagem nova vinda da subscription', () => {
		let capturedOnMessage: ((m: ChatMessageRecord) => void) | undefined;
		const subscribe = vi.fn((_roomId: string, onMessage: (m: ChatMessageRecord) => void) => {
			capturedOnMessage = onMessage;
			return () => {};
		});
		const feed = new ChatMessagesFeed('room-1', [], subscribe);
		feed.start();

		capturedOnMessage?.(makeMessage('m2', 'nova mensagem'));

		expect(feed.messages).toHaveLength(1);
		expect(feed.messages[0].text).toBe('nova mensagem');
	});

	test('deduplica mensagem já presente por id', () => {
		let capturedOnMessage: ((m: ChatMessageRecord) => void) | undefined;
		const subscribe = vi.fn((_roomId: string, onMessage: (m: ChatMessageRecord) => void) => {
			capturedOnMessage = onMessage;
			return () => {};
		});
		const initial = [makeMessage('m1', 'oi')];
		const feed = new ChatMessagesFeed('room-1', initial, subscribe);
		feed.start();

		capturedOnMessage?.(makeMessage('m1', 'oi'));

		expect(feed.messages).toHaveLength(1);
	});

	test('stop() chama a função de unsubscribe retornada', () => {
		const unsubscribe = vi.fn();
		const feed = new ChatMessagesFeed('room-1', [], () => unsubscribe);
		feed.start();
		feed.stop();
		expect(unsubscribe).toHaveBeenCalledOnce();
	});

	test('sync() substitui as mensagens (revalidação do load)', () => {
		const feed = new ChatMessagesFeed('room-1', [makeMessage('m1', 'oi')], () => () => {});
		feed.sync([makeMessage('m1', 'oi'), makeMessage('m2', 'tudo bem?')]);
		expect(feed.messages).toHaveLength(2);
	});
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `pnpm --filter runes test -- src/lib/domain/ChatMessagesFeed.test.ts`
Expected: FAIL com "Cannot find module './ChatMessagesFeed.svelte'".

- [ ] **Step 3: Implementar**

```ts
import type { ChatMessageRecord } from '$lib/server/chatRecord';

export type ChatMessageSubscribe = (
	roomId: string,
	onMessage: (message: ChatMessageRecord) => void
) => () => void;

export class ChatMessagesFeed {
	#messages = $state<ChatMessageRecord[]>([]);
	#roomId: string;
	#subscribeFn: ChatMessageSubscribe;
	#unsubscribe: (() => void) | null = null;

	constructor(roomId: string, initialMessages: ChatMessageRecord[], subscribeFn: ChatMessageSubscribe) {
		this.#roomId = roomId;
		this.#messages = initialMessages;
		this.#subscribeFn = subscribeFn;
	}

	get messages(): ChatMessageRecord[] {
		return this.#messages;
	}

	start(): void {
		this.#unsubscribe = this.#subscribeFn(this.#roomId, (message) => this.#addMessage(message));
	}

	stop(): void {
		this.#unsubscribe?.();
		this.#unsubscribe = null;
	}

	sync(messages: ChatMessageRecord[]): void {
		this.#messages = messages;
	}

	#addMessage(message: ChatMessageRecord): void {
		if (this.#messages.some((existing) => existing.id === message.id)) return;
		this.#messages = [...this.#messages, message];
	}
}
```

- [ ] **Step 4: Rodar e confirmar sucesso**

Run: `pnpm --filter runes test -- src/lib/domain/ChatMessagesFeed.test.ts`
Expected: PASS (5 testes).

- [ ] **Step 5: Commit**

```bash
git add apps/runes/src/lib/domain/ChatMessagesFeed.svelte.ts apps/runes/src/lib/domain/ChatMessagesFeed.test.ts
git commit -m "feat(runes): adicionar ChatMessagesFeed (domínio reativo com dedup)"
```

---

### Task 13: `/chat/[roomId]` — visualizar sala, enviar mensagem, sair, gerenciar participantes

**Files:**
- Create: `apps/runes/src/routes/chat/[roomId]/+page.server.ts`
- Create: `apps/runes/src/routes/chat/[roomId]/+page.svelte`

**Interfaces:**
- Consumes: `chatRoomAccess` (Task 3), `sendMessageSchema` (Task 4), `findAuthRecordByEmail` (Task 5), `createBrowserClient` (Task 11), `ChatMessagesFeed` (Task 12), `Avatar.svelte` (Task 7).
- Produces: rota `/chat/[roomId]` completa (load + 4 actions).

- [ ] **Step 1: `+page.server.ts`**

```ts
import { error, fail, redirect } from '@sveltejs/kit';
import { ClientResponseError } from 'pocketbase';
import type PocketBase from 'pocketbase';
import type { Actions, PageServerLoad } from './$types';
import type { ChatMessageRecord, ChatRoomRecord } from '$lib/server/chatRecord';
import { isCreator, isParticipant, nextCreatorAfter } from '$lib/domain/chatRoomAccess';
import { findAuthRecordByEmail } from '$lib/server/authLookup';
import { sendMessageSchema } from '$lib/validation/chatSchemas';
import { fieldErrorsFrom } from '$lib/validation/formErrors';

const FORBIDDEN_ERROR = 'Você não tem permissão para esta ação.';
const MESSAGES_PAGE_SIZE = 50;

async function getRoom(pb: PocketBase, id: string): Promise<ChatRoomRecord> {
	try {
		return await pb.collection('chat_rooms').getOne<ChatRoomRecord>(id, { expand: 'participants' });
	} catch {
		throw error(404, 'Sala não encontrada.');
	}
}

function requireParticipant(room: ChatRoomRecord, userId: string) {
	if (!isParticipant({ createdBy: room.created_by, participantIds: room.participants }, userId)) {
		return fail(403, { errors: { general: FORBIDDEN_ERROR } });
	}
	return null;
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const userId = locals.pb.authStore.record?.id ?? '';
	const room = await getRoom(locals.pb, params.id);

	if (!isParticipant({ createdBy: room.created_by, participantIds: room.participants }, userId)) {
		throw error(403, 'Você não tem acesso a esta sala.');
	}

	const messagesPage = await locals.pb
		.collection('chat_messages')
		.getList<ChatMessageRecord>(1, MESSAGES_PAGE_SIZE, {
			filter: locals.pb.filter('room = {:roomId}', { roomId: room.id }),
			sort: '-created',
			expand: 'sender'
		});
	const messages = messagesPage.items.slice().reverse();

	return {
		room,
		messages,
		userId,
		pbToken: locals.pb.authStore.token,
		pbRecord: locals.pb.authStore.record
	};
};

export const actions: Actions = {
	sendMessage: async ({ request, params, locals }) => {
		const userId = locals.pb.authStore.record?.id ?? '';
		const room = await getRoom(locals.pb, params.id);
		const denied = requireParticipant(room, userId);
		if (denied) return denied;

		const formData = await request.formData();
		const parsed = sendMessageSchema.safeParse({ text: formData.get('text') });
		if (!parsed.success) {
			return fail(400, { errors: fieldErrorsFrom(parsed.error) });
		}

		await locals.pb.collection('chat_messages').create({
			room: room.id,
			sender: userId,
			text: parsed.data.text
		});

		return { success: true };
	},

	leaveRoom: async ({ params, locals }) => {
		const userId = locals.pb.authStore.record?.id ?? '';
		const room = await getRoom(locals.pb, params.id);
		const denied = requireParticipant(room, userId);
		if (denied) return denied;

		const remaining = room.participants.filter((id) => id !== userId);

		if (remaining.length === 0) {
			await locals.pb.collection('chat_rooms').delete(room.id);
			throw redirect(303, '/chat');
		}

		const roomAccess = { createdBy: room.created_by, participantIds: room.participants };
		const update: { participants: string[]; created_by?: string } = { participants: remaining };
		if (isCreator(roomAccess, userId)) {
			update.created_by = nextCreatorAfter(room.participants, userId) ?? remaining[0];
		}

		await locals.pb.collection('chat_rooms').update(room.id, update);
		throw redirect(303, '/chat');
	},

	addParticipant: async ({ request, params, locals }) => {
		const userId = locals.pb.authStore.record?.id ?? '';
		const room = await getRoom(locals.pb, params.id);
		const roomAccess = { createdBy: room.created_by, participantIds: room.participants };
		if (!isCreator(roomAccess, userId)) {
			return fail(403, { errors: { general: FORBIDDEN_ERROR } });
		}

		const formData = await request.formData();
		const email = formData.get('email');
		if (typeof email !== 'string' || !email) {
			return fail(400, { errors: { email: 'E-mail obrigatório.' } });
		}

		let authRecord;
		try {
			authRecord = await findAuthRecordByEmail(locals.pb, email);
		} catch {
			return fail(400, { errors: { email: 'Usuário não encontrado.' } });
		}

		if (room.participants.includes(authRecord.id)) {
			return fail(400, { errors: { email: 'Usuário já é participante.' } });
		}

		await locals.pb.collection('chat_rooms').update(room.id, {
			participants: [...room.participants, authRecord.id]
		});

		return { success: true };
	},

	removeParticipant: async ({ request, params, locals }) => {
		const userId = locals.pb.authStore.record?.id ?? '';
		const room = await getRoom(locals.pb, params.id);
		const roomAccess = { createdBy: room.created_by, participantIds: room.participants };
		if (!isCreator(roomAccess, userId)) {
			return fail(403, { errors: { general: FORBIDDEN_ERROR } });
		}

		const formData = await request.formData();
		const targetId = formData.get('userId');
		if (typeof targetId !== 'string' || !targetId) {
			return fail(400, { errors: { general: 'Usuário inválido.' } });
		}

		const remaining = room.participants.filter((id) => id !== targetId);
		await locals.pb.collection('chat_rooms').update(room.id, { participants: remaining });

		return { success: true };
	}
};
```

- [ ] **Step 2: `+page.svelte`**

```svelte
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { enhance } from '$app/forms';
	import { createBrowserClient } from '$lib/client/pocketbaseClient';
	import { ChatMessagesFeed } from '$lib/domain/ChatMessagesFeed.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import IconTrash from '$lib/components/icons/IconTrash.svelte';
	import type { ChatMessageRecord } from '$lib/server/chatRecord';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const feed = new ChatMessagesFeed(data.room.id, data.messages, (roomId, onMessage) => {
		const pb = createBrowserClient(data.pbToken, data.pbRecord);
		let stopped = false;

		pb.collection('chat_messages')
			.subscribe<ChatMessageRecord>(
				'*',
				(event) => {
					if (event.action === 'create') onMessage(event.record);
				},
				{ filter: `room = "${roomId}"`, expand: 'sender' }
			)
			.catch(() => {});

		return () => {
			if (stopped) return;
			stopped = true;
			pb.collection('chat_messages').unsubscribe('*');
		};
	});

	$effect(() => {
		feed.sync(data.messages);
	});

	onMount(() => feed.start());
	onDestroy(() => feed.stop());

	const otherParticipants = $derived((data.room.expand?.participants ?? []).filter((p) => p.id !== data.userId));
	const isRoomCreator = $derived(data.room.created_by === data.userId);
</script>

<div class="flex flex-col gap-4 max-w-2xl mx-auto w-full">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold font-display" data-testid="room-title">
			{data.room.name || otherParticipants.map((p) => p.name).join(', ')}
		</h1>
		<form method="POST" action="?/leaveRoom" data-testid="leave-room-form">
			<button type="submit" class="btn btn-outline btn-sm" data-testid="btn-leave-room">Sair da sala</button>
		</form>
	</div>

	{#if form?.errors?.general}
		<div class="alert alert-error" role="alert" data-testid="error-chat">{form.errors.general}</div>
	{/if}

	{#if isRoomCreator}
		<div class="card bg-base-100 border border-base-300 shadow-sm">
			<div class="card-body gap-2">
				<p class="font-medium text-sm">Participantes</p>
				<ul class="flex flex-col gap-1">
					{#each otherParticipants as p (p.id)}
						<li class="flex items-center justify-between gap-2" data-testid="participant-row-{p.id}">
							<span class="flex items-center gap-2">
								<Avatar userId={p.id} avatar={p.avatar} name={p.name} size="size-6" />
								{p.name}
							</span>
							<form method="POST" action="?/removeParticipant">
								<input type="hidden" name="userId" value={p.id} />
								<button type="submit" class="btn btn-ghost btn-xs" data-testid="btn-remove-participant-{p.id}">
									<IconTrash class="size-3.5" />
								</button>
							</form>
						</li>
					{/each}
				</ul>
				<form method="POST" action="?/addParticipant" novalidate class="flex gap-2" data-testid="add-participant-form">
					<input
						type="email"
						name="email"
						placeholder="E-mail do participante"
						data-testid="input-add-participant"
						class="input input-bordered input-sm flex-1"
					/>
					<button type="submit" class="btn btn-sm" data-testid="btn-add-participant">Adicionar</button>
				</form>
			</div>
		</div>
	{/if}

	<div class="card bg-base-100 border border-base-300 shadow-sm flex-1" data-testid="chat-messages-card">
		<div class="card-body gap-2">
			{#each feed.messages as message (message.id)}
				<div class="flex items-start gap-2" data-testid="chat-message-{message.id}">
					<Avatar
						userId={message.sender}
						avatar={message.expand?.sender?.avatar ?? ''}
						name={message.expand?.sender?.name ?? ''}
						size="size-6"
					/>
					<div>
						<p class="text-xs opacity-60">{message.expand?.sender?.name}</p>
						<p data-testid="chat-message-text-{message.id}">{message.text}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<form
		method="POST"
		action="?/sendMessage"
		novalidate
		class="flex gap-2"
		data-testid="send-message-form"
		use:enhance={() => {
			return async ({ update }) => {
				await update({ reset: true });
			};
		}}
	>
		<input
			type="text"
			name="text"
			placeholder="Escreva uma mensagem..."
			data-testid="input-message"
			class="input input-bordered flex-1"
			required
		/>
		<button type="submit" class="btn btn-primary" data-testid="btn-send-message">Enviar</button>
	</form>
</div>
```

- [ ] **Step 3: Verificar manualmente (realtime entre duas abas)**

Run: `pnpm dev:full`
Expected: criar uma sala em `/chat/new`, abrir a mesma sala em duas abas logadas como usuários diferentes, enviar mensagem em uma aba e ver aparecer na outra sem reload; a própria mensagem enviada não aparece duplicada.

- [ ] **Step 4: Commit**

```bash
git add apps/runes/src/routes/chat/[roomId]
git commit -m "feat(runes): adicionar visualização de sala com mensagens em tempo real"
```

---

### Task 14: App Hub — card "Chat"

**Files:**
- Modify: `apps/runes/src/lib/appRegistry.ts`

**Interfaces:**
- Consumes: ícone `MessageCircle` de `lucide-svelte` (já é dependência do projeto).

- [ ] **Step 1: Adicionar a entrada**

```ts
import { ListChecks, MessageCircle, Users } from 'lucide-svelte';

export interface AppEntry {
	id: string;
	name: string;
	description: string;
	icon: any;
	route: string;
	adminOnly?: boolean;
}

export const appRegistry: AppEntry[] = [
	{
		id: 'todos',
		name: 'Tarefas',
		description: 'Gerencie suas listas de tarefas do dia a dia',
		icon: ListChecks,
		route: '/todos'
	},
	{
		id: 'chat',
		name: 'Chat',
		description: 'Converse em tempo real com outros usuários',
		icon: MessageCircle,
		route: '/chat'
	},
	{
		id: 'users',
		name: 'Usuários',
		description: 'Gerencie os usuários do sistema',
		icon: Users,
		route: '/users',
		adminOnly: true
	}
];
```

- [ ] **Step 2: Verificar manualmente**

Run: `pnpm dev:full`, acesse `/`.
Expected: card "Chat" aparece no App Hub e leva a `/chat`.

- [ ] **Step 3: Commit**

```bash
git add apps/runes/src/lib/appRegistry.ts
git commit -m "feat(runes): adicionar Chat ao App Hub"
```

---

### Task 15: E2E — fluxo de chat (Playwright)

**Files:**
- Modify: `apps/runes/e2e/cleanup.ts`
- Create: `apps/runes/e2e/chat.spec.ts`

**Interfaces:**
- Consumes: `cleanupRecords` (já existe em `cleanup.ts`), fixture `test`/`expect` de `./fixtures`.
- Produces: `cleanupChatRoom(request, name)`.

- [ ] **Step 1: Adicionar `cleanupChatRoom` a `cleanup.ts`**

Adicionar ao final do arquivo `apps/runes/e2e/cleanup.ts`:

```ts
/** Remove uma sala de chat temporária. Mensagens cascateiam com a sala. */
export async function cleanupChatRoom(request: APIRequestContext, name: string): Promise<void> {
	await cleanupRecords(request, 'chat_rooms', 'name = {:name}', { name });
}
```

- [ ] **Step 2: Escrever o teste e2e**

```ts
import { test, expect } from './fixtures';
import { cleanupChatRoom } from './cleanup';

test.describe('Chat (runes e2e)', () => {
	const uniqueId = Date.now().toString(36);
	const roomName = `Sala ${uniqueId}`;

	test('cria sala sem outros participantes, envia mensagem, sai da sala', async ({ page }) => {
		try {
			await page.goto('/chat/new');
			await page.getByTestId('input-room-name').fill(roomName);
			await page.getByTestId('btn-create-room').click();

			await expect(page.getByTestId('room-title')).toContainText(roomName);

			await page.getByTestId('input-message').fill('Mensagem de teste');
			await page.getByTestId('btn-send-message').click();
			await expect(page.getByTestId('chat-messages-card')).toContainText('Mensagem de teste');

			await page.getByTestId('btn-leave-room').click();
			await page.waitForURL('/chat');
		} finally {
			await cleanupChatRoom(page.request, roomName);
		}
	});

	test('validação de participantes vazios em nova sala', async ({ page }) => {
		await page.goto('/chat/new');
		await page.getByTestId('btn-create-room').click();
		await expect(page.getByTestId('error-participant-ids')).toBeVisible();
	});
});
```

- [ ] **Step 3: Rodar e confirmar sucesso**

Run: `pnpm --filter runes test:e2e -- chat.spec.ts`
Expected: PASS (2 testes). Backend precisa estar rodando (`pnpm backend:dev` ou `pnpm dev:full`).

- [ ] **Step 4: Commit**

```bash
git add apps/runes/e2e/cleanup.ts apps/runes/e2e/chat.spec.ts
git commit -m "test(e2e): adicionar fluxo de criação de sala e envio de mensagem"
```

---

### Task 16: Verificação final

**Files:** nenhum (task de validação)

- [ ] **Step 1: Rodar toda a suíte de testes**

Run: `pnpm test`
Expected: todos os testes passam, incluindo os novos de `chatRoomAccess`, `chatSchemas` e `ChatMessagesFeed`.

- [ ] **Step 2: Rodar checagem de tipos**

Run: `pnpm check`
Expected: sem erros de tipo em nenhum app/pacote.

- [ ] **Step 3: Rodar e2e completo**

Run: `pnpm --filter runes test:e2e`
Expected: todos os specs e2e passam, incluindo os novos de chat, sem quebrar os existentes (`todo-list-management`, `user-crud`, etc.).

- [ ] **Step 4: Revisar `docs/CODE-STRUCTURE.md`**

Atualizar a seção do app `runes` com as novas rotas (`/chat`, `/chat/new`, `/chat/[roomId]`, `/profile`), os novos arquivos de domínio/validação/server/client, e a nova migration em `pocketbase/pb_migrations/`. Ver `.cursor/rules/meta/code-structure.mdc`.

---

## Self-Review

**1. Cobertura da spec:** RF1–RF9 cobertos pelas Tasks 1, 2, 7, 8 (avatar), 9, 10, 13 (salas/mensagens/participantes/realtime). RF10 (transferência de criador) na Task 3 + Task 13 (`leaveRoom`). AC11 (dedup) na Task 12. AC12 (picker de participantes p/ não-admin) nas Tasks 2 e 10. Nenhum requisito funcional ficou sem task correspondente.

**2. Placeholders:** nenhum "TBD"/"implementar depois" — todo step tem código completo e executável.

**3. Consistência de tipos:** `ChatRoomRecord`/`ChatMessageRecord`/`AuthParticipant` (Task 5) usados de forma idêntica em Tasks 9, 10, 12, 13. `ChatRoomAccessInfo`/`isParticipant`/`isCreator`/`nextCreatorAfter` (Task 3) usados com a mesma assinatura na Task 13. `ChatMessageSubscribe` (Task 12) usado com a mesma assinatura na Task 13.

import type { APIRequestContext } from '@playwright/test';
import { PB_API_URL, authenticateSeedAdmin } from './env';

function escapeFilterValue(value: string): string {
	return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Builds a PocketBase filter from a template with `{:name}` placeholders,
 * mirroring `pb.filter()` so test data never lands unescaped in the query.
 */
export function pbFilter(template: string, params: Record<string, string>): string {
	return template.replace(/\{:(\w+)\}/g, (_, key: string) => {
		if (!(key in params)) throw new Error(`Parâmetro ausente no filtro: ${key}`);
		return `'${escapeFilterValue(params[key])}'`;
	});
}

/**
 * Removes every record of a PocketBase collection matching the filter.
 *
 * Runs inside `finally` blocks, so it never throws: a failure here would mask
 * the real test failure. It warns loudly instead — silent cleanup failures are
 * what let a stale seed password poison the whole suite.
 */
export async function cleanupRecords(
	request: APIRequestContext,
	collection: string,
	template: string,
	params: Record<string, string>
): Promise<void> {
	const filter = pbFilter(template, params);

	const token = await authenticateSeedAdmin(request);
	if (!token) {
		console.warn(`[cleanup] falha ao autenticar como seed admin; ${collection} não foi limpo.`);
		return;
	}

	const headers = { Authorization: `Bearer ${token}` };
	const searchResp = await request.get(
		`${PB_API_URL}/api/collections/${collection}/records?filter=${encodeURIComponent(filter)}`,
		{ headers, failOnStatusCode: false }
	);

	if (!searchResp.ok()) {
		console.warn(
			`[cleanup] busca em ${collection} falhou (${searchResp.status()}); registros podem ter ficado órfãos.`
		);
		return;
	}

	const { items } = await searchResp.json();
	for (const item of items) {
		const deleteResp = await request.delete(
			`${PB_API_URL}/api/collections/${collection}/records/${item.id}`,
			{ headers, failOnStatusCode: false }
		);

		if (!deleteResp.ok()) {
			console.warn(
				`[cleanup] não foi possível excluir ${collection}/${item.id} (${deleteResp.status()}).`
			);
		}
	}
}

/**
 * Removes a temporary user. Creating one writes to both `user` and `auth`
 * (see users/new/+page.server.ts), so both have to be cleaned up.
 */
export async function cleanupUser(request: APIRequestContext, email: string): Promise<void> {
	await cleanupRecords(request, 'user', 'email = {:email}', { email });
	await cleanupRecords(request, 'auth', 'email = {:email}', { email });
}

/** Removes a temporary todo list. Items cascade with the list. */
export async function cleanupTodoList(request: APIRequestContext, title: string): Promise<void> {
	await cleanupRecords(request, 'todo_lists', 'title = {:title}', { title });
}

/** Removes a temporary chat room. Messages cascade with the room. */
export async function cleanupChatRoom(request: APIRequestContext, name: string): Promise<void> {
	await cleanupRecords(request, 'chat_rooms', 'name = {:name}', { name });
}

/** Removes a temporary kanban card. Comments and history cascade with the card. */
export async function cleanupKanbanCard(request: APIRequestContext, title: string): Promise<void> {
	await cleanupRecords(request, 'kanban_cards', 'title = {:title}', { title });
}

/** Removes a temporary kanban column. */
export async function cleanupKanbanColumn(request: APIRequestContext, name: string): Promise<void> {
	await cleanupRecords(request, 'kanban_columns', 'name = {:name}', { name });
}

/** Removes a temporary poker room. Tasks, participants and votes cascade with the room. */
export async function cleanupPokerRoom(request: APIRequestContext, name: string): Promise<void> {
	await cleanupRecords(request, 'poker_rooms', 'name = {:name}', { name });
}

/** Removes a temporary project. Columns and sprints cascade with the project. */
export async function cleanupProject(request: APIRequestContext, title: string): Promise<void> {
	await cleanupRecords(request, 'projects', 'title = {:title}', { title });
}

/** Removes a temporary notification by title (system notifications site-wide). */
export async function cleanupNotification(request: APIRequestContext, title: string): Promise<void> {
	await cleanupRecords(request, 'notifications', 'title = {:title}', { title });
}

import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getAdminClient } from '$lib/server/pocketbaseAdmin';
import { logError } from '$lib/server/logger';
import type { CategoryRecord } from '$lib/server/categoryRecord';
import type { TodoItemRecord } from '$lib/server/todoRecord';
import type { KanbanCardRecord } from '$lib/server/kanbanRecord';
import type { PokerTaskRecord } from '$lib/server/pokerRecord';
import type { SpecDocumentRecord } from '$lib/server/specRecord';
import type { RetroCardRecord } from '$lib/server/retroRecord';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const categoryId = params.id;
	if (!categoryId) {
		throw error(404, 'Categoria não encontrada.');
	}

	try {
		const adminPb = await getAdminClient();

		const category = await adminPb.collection('categories').getOne<CategoryRecord>(categoryId).catch(() => null);
		if (!category) {
			throw error(404, 'Categoria não encontrada.');
		}

		// Consultas paralelas em todos os 5 módulos com expansões úteis
		const [todos, kanbanCards, pokerTasks, specDocs, retroCards] = await Promise.all([
			adminPb
				.collection('todo_items')
				.getFullList<TodoItemRecord & { expand?: { list?: { id: string; title: string; owner: string } } }>({
					filter: adminPb.filter('category = {:id}', { id: categoryId }),
					sort: '-created',
					expand: 'list'
				})
				.catch((e) => {
					logError('categories:[id]:todos', e);
					return [];
				}),

			adminPb
				.collection('kanban_cards')
				.getFullList<KanbanCardRecord>({
					filter: adminPb.filter('category = {:id}', { id: categoryId }),
					sort: '-created',
					expand: 'column,project,sprint'
				})
				.catch((e) => {
					logError('categories:[id]:kanban', e);
					return [];
				}),

			adminPb
				.collection('poker_tasks')
				.getFullList<PokerTaskRecord & { expand?: { room?: { id: string; name: string; project?: string } } }>({
					filter: adminPb.filter('category = {:id}', { id: categoryId }),
					sort: '-created',
					expand: 'room'
				})
				.catch((e) => {
					logError('categories:[id]:poker', e);
					return [];
				}),

			adminPb
				.collection('spec_documents')
				.getFullList<SpecDocumentRecord>({
					filter: adminPb.filter('category = {:id}', { id: categoryId }),
					sort: '-created',
					expand: 'project'
				})
				.catch((e) => {
					logError('categories:[id]:specs', e);
					return [];
				}),

			adminPb
				.collection('retro_cards')
				.getFullList<RetroCardRecord & { expand?: { column?: { id: string; name: string }; retro?: { id: string; project: string; sprint: string } } }>({
					filter: adminPb.filter('category = {:id}', { id: categoryId }),
					sort: '-created',
					expand: 'column,retro'
				})
				.catch((e) => {
					logError('categories:[id]:retro', e);
					return [];
				})
		]);

		return {
			category,
			todos,
			kanbanCards,
			pokerTasks,
			specDocs,
			retroCards
		};
	} catch (e: unknown) {
		if (e && typeof e === 'object' && 'status' in e && typeof e.status === 'number') {
			throw e;
		}
		logError('categories:[id]:load', e);
		throw error(500, 'Erro ao carregar dados da categoria.');
	}
};

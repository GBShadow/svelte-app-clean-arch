import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getAdminClient } from '$lib/server/pocketbaseAdmin';
import { canViewProject } from '$lib/domain/projectAccess';
import {
	canViewDocument,
	canEditDocument,
	canDeleteDocument,
	canManagePermissions
} from '$lib/domain/specAccess';
import {
	updateDocSchema,
	addPermissionSchema,
	removePermissionSchema,
	createTaskFromDocSchema
} from '$lib/validation/specSchemas';
import { logError } from '$lib/server/logger';
import type { SpecDocumentRecord, SpecTagRecord, SpecPermissionRecord } from '$lib/server/specRecord';
import type { PokerTaskRecord } from '$lib/server/pokerRecord';
import type { KanbanCardRecord } from '$lib/server/kanbanRecord';
import type { ProjectRecord } from '$lib/server/projectRecord';
import type { UserRecord } from '$lib/server/userRecord';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) throw redirect(303, '/login');

	const { projectId, docId } = params;
	const adminPb = await getAdminClient();

	let project: ProjectRecord;
	try {
		project = await adminPb.collection('projects').getOne<ProjectRecord>(projectId, {
			expand: 'created_by,responsaveis,participants'
		});
	} catch {
		throw error(404, 'Projeto não encontrado');
	}

	if (!canViewProject(locals.user, project)) {
		throw error(404, 'Projeto não encontrado');
	}

	let doc: SpecDocumentRecord;
	try {
		doc = await adminPb.collection('spec_documents').getOne(docId, {
			expand: 'created_by'
		}) as unknown as SpecDocumentRecord;
	} catch {
		throw error(404, 'Documento não encontrado');
	}

	if (doc.project !== projectId) {
		throw error(404, 'Documento não encontrado');
	}

	const permissions = await adminPb.collection('spec_document_permissions').getFullList({
		filter: adminPb.filter('document = {:docId}', { docId }),
		expand: 'user'
	}) as unknown as SpecPermissionRecord[];

	if (!canViewDocument(locals.user, doc, permissions)) {
		throw error(404, 'Documento não encontrado');
	}

	const tags = await adminPb.collection('spec_tags').getFullList({
		filter: adminPb.filter('document = {:docId}', { docId })
	}) as unknown as SpecTagRecord[];

	const tagList = tags.map((t) => t.tag);

	// Load linked tasks (poker_tasks with source_spec = docId)
	const linkedTasks = await adminPb.collection('poker_tasks').getFullList({
		filter: adminPb.filter('source_spec = {:docId}', { docId }),
		sort: '-created'
	}) as unknown as PokerTaskRecord[];

	// Load linked kanban cards
	const linkedCards = await adminPb.collection('kanban_cards').getFullList({
		filter: adminPb.filter('source_spec = {:docId}', { docId }),
		sort: '-created'
	}) as unknown as KanbanCardRecord[];

	const users = await adminPb.collection('user').getFullList({
		sort: 'name'
	}) as unknown as UserRecord[];

	return {
		project,
		doc,
		tags: tagList,
		permissions,
		linkedTasks,
		linkedCards,
		users,
		canEdit: canEditDocument(locals.user, doc, permissions),
		canDelete: canDeleteDocument(locals.user, doc),
		canManagePermissions: canManagePermissions(locals.user, doc),
		token: locals.pb.authStore.token
	};
};

export const actions: Actions = {
	updateDoc: async ({ request, locals, params }) => {
		if (!locals.user) return fail(401);

		const { projectId, docId } = params;
		const formData = await request.formData();
		const title = formData.get('title') as string;
		const body_md = formData.get('body_md') as string;
		const tagsRaw = formData.get('tags') as string;
		const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : [];

		const val = updateDocSchema.safeParse({ title, body_md, tags });
		if (!val.success) {
			return fail(400, { errors: val.error.flatten().fieldErrors });
		}

		const adminPb = await getAdminClient();

		let project: ProjectRecord;
		try {
			project = await adminPb.collection('projects').getOne(projectId);
		} catch {
			return fail(404);
		}

		if (!canViewProject(locals.user, project)) return fail(403);

		let doc: SpecDocumentRecord;
		try {
			doc = await adminPb.collection('spec_documents').getOne(docId) as unknown as SpecDocumentRecord;
		} catch {
			return fail(404);
		}

		const permissions = await adminPb.collection('spec_document_permissions').getFullList({
			filter: adminPb.filter('document = {:docId}', { docId })
		}) as unknown as SpecPermissionRecord[];

		if (!canEditDocument(locals.user, doc, permissions)) return fail(403);

		await adminPb.collection('spec_documents').update(docId, {
			title: val.data.title,
			body_md: val.data.body_md
		});

		// Sync tags: delete all existing and recreate
		const existingTags = await adminPb.collection('spec_tags').getFullList({
			filter: adminPb.filter('document = {:docId}', { docId })
		});

		for (const tag of existingTags) {
			await adminPb.collection('spec_tags').delete(tag.id);
		}

		for (const tag of val.data.tags) {
			await adminPb.collection('spec_tags').create({
				document: docId,
				tag
			});
		}

		return { success: true };
	},

	deleteDoc: async ({ locals, params }) => {
		if (!locals.user) return fail(401);

		const { projectId, docId } = params;

		const adminPb = await getAdminClient();

		let project: ProjectRecord;
		try {
			project = await adminPb.collection('projects').getOne(projectId);
		} catch {
			return fail(404);
		}

		if (!canViewProject(locals.user, project)) return fail(403);

		let doc: SpecDocumentRecord;
		try {
			doc = await adminPb.collection('spec_documents').getOne(docId) as unknown as SpecDocumentRecord;
		} catch {
			return fail(404);
		}

		if (!canDeleteDocument(locals.user, doc)) return fail(403);

		await adminPb.collection('spec_documents').delete(docId);

		throw redirect(303, `/projects/${projectId}/specs`);
	},

	togglePublic: async ({ locals, params }) => {
		if (!locals.user) return fail(401);

		const { projectId, docId } = params;
		const adminPb = await getAdminClient();

		let doc: SpecDocumentRecord;
		try {
			doc = await adminPb.collection('spec_documents').getOne(docId) as unknown as SpecDocumentRecord;
		} catch {
			return fail(404);
		}

		if (!canManagePermissions(locals.user, doc)) return fail(403);

		await adminPb.collection('spec_documents').update(docId, {
			is_public_link: !doc.is_public_link
		});

		return { success: true };
	},

	addPermission: async ({ request, locals, params }) => {
		if (!locals.user) return fail(401);

		const { projectId, docId } = params;
		const formData = await request.formData();
		const userId = formData.get('userId') as string;
		const role = formData.get('role') as 'view' | 'edit';

		const val = addPermissionSchema.safeParse({ userId, role });
		if (!val.success) {
			return fail(400, { errors: val.error.flatten().fieldErrors });
		}

		const adminPb = await getAdminClient();

		let doc: SpecDocumentRecord;
		try {
			doc = await adminPb.collection('spec_documents').getOne(docId) as unknown as SpecDocumentRecord;
		} catch {
			return fail(404);
		}

		if (!canManagePermissions(locals.user, doc)) return fail(403);

		const pair = `${docId}:${val.data.userId}`;

		const existing = await adminPb.collection('spec_document_permissions').getFullList({
			filter: adminPb.filter('pair = {:pair}', { pair })
		}) as unknown as SpecPermissionRecord[];

		if (existing.length > 0) {
			await adminPb.collection('spec_document_permissions').update(existing[0].id, {
				role: val.data.role
			});
		} else {
			await adminPb.collection('spec_document_permissions').create({
				document: docId,
				user: val.data.userId,
				role: val.data.role,
				pair
			});
		}

		return { success: true };
	},

	removePermission: async ({ request, locals, params }) => {
		if (!locals.user) return fail(401);

		const { projectId, docId } = params;
		const formData = await request.formData();
		const permissionId = formData.get('permissionId') as string;

		const val = removePermissionSchema.safeParse({ permissionId });
		if (!val.success) {
			return fail(400, { errors: val.error.flatten().fieldErrors });
		}

		const adminPb = await getAdminClient();

		let doc: SpecDocumentRecord;
		try {
			doc = await adminPb.collection('spec_documents').getOne(docId) as unknown as SpecDocumentRecord;
		} catch {
			return fail(404);
		}

		if (!canManagePermissions(locals.user, doc)) return fail(403);

		await adminPb.collection('spec_document_permissions').delete(val.data.permissionId);

		return { success: true };
	},

	createTask: async ({ request, locals, params }) => {
		if (!locals.user) return fail(401);

		const { projectId, docId } = params;
		const formData = await request.formData();
		const title = formData.get('title') as string;
		const description = formData.get('description') as string;

		const val = createTaskFromDocSchema.safeParse({ title, description });
		if (!val.success) {
			return fail(400, { errors: val.error.flatten().fieldErrors });
		}

		const adminPb = await getAdminClient();

		let doc: SpecDocumentRecord;
		try {
			doc = await adminPb.collection('spec_documents').getOne(docId) as unknown as SpecDocumentRecord;
		} catch {
			return fail(404);
		}

		const permissions = await adminPb.collection('spec_document_permissions').getFullList({
			filter: adminPb.filter('document = {:docId}', { docId })
		}) as unknown as SpecPermissionRecord[];

		if (!canEditDocument(locals.user, doc, permissions)) return fail(403);

		const task = await adminPb.collection('poker_tasks').create({
			title: val.data.title,
			description: val.data.description,
			room: null,
			status: 'backlog',
			is_global_backlog: true,
			final_points: null,
			exported_card: null,
			source_spec: docId
		});

		return { taskId: task.id };
	}
};

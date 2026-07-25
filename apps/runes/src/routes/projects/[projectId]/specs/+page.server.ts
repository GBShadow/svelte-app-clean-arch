import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getAdminClient } from '$lib/server/pocketbaseAdmin';
import { canViewProject, canManageProject } from '$lib/domain/projectAccess';
import { canDeleteDocument, filterDocumentsByAccess } from '$lib/domain/specAccess';
import { createDocSchema } from '$lib/validation/specSchemas';
import { logError } from '$lib/server/logger';
import type { SpecDocumentRecord, SpecTagRecord, SpecPermissionRecord, SpecDocumentWithTags } from '$lib/server/specRecord';
import type { ProjectRecord } from '$lib/server/projectRecord';
import type { UserRecord } from '$lib/server/userRecord';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	if (!locals.user) throw redirect(303, '/login');

	const { projectId } = params;
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

	const tab = url.searchParams.get('tab') || 'mine';
	const q = url.searchParams.get('q') || '';
	const tagFilter = url.searchParams.get('tag') || '';

	let allDocs = await adminPb.collection('spec_documents').getFullList({
		filter: adminPb.filter('project = {:projectId}', { projectId }),
		sort: '-updated',
		expand: 'created_by'
	}) as unknown as SpecDocumentRecord[];

	const allPermissions = await adminPb.collection('spec_document_permissions').getFullList({
		filter: adminPb.filter('document.project = {:projectId}', { projectId })
	}) as unknown as SpecPermissionRecord[];

	// Filter by access
	let accessibleDocs = filterDocumentsByAccess(locals.user, allDocs, allPermissions);

	// Tab filter
	if (tab === 'mine') {
		accessibleDocs = accessibleDocs.filter((d) => d.created_by === locals.user?.id);
	} else {
		accessibleDocs = accessibleDocs.filter((d) => d.created_by !== locals.user?.id);
	}

	// Tag filter
	if (tagFilter) {
		const tags = await adminPb.collection('spec_tags').getFullList({
			filter: adminPb.filter('tag = {:tag}', { tag: tagFilter })
		}) as unknown as SpecTagRecord[];

		const docIdsWithTag = new Set(tags.map((t) => t.document));
		accessibleDocs = accessibleDocs.filter((d) => docIdsWithTag.has(d.id));
	}

	// Name filter
	if (q) {
		const lowerQ = q.toLowerCase();
		accessibleDocs = accessibleDocs.filter((d) => d.title.toLowerCase().includes(lowerQ));
	}

	// Load tags for each doc and project-wide tag suggestions
	const docIds = accessibleDocs.map((d) => d.id);
	let allProjectTags: string[] = [];
	const docTagsMap = new Map<string, string[]>();

	if (docIds.length > 0) {
		const tagRecords = await adminPb.collection('spec_tags').getFullList({
			filter: docIds.map((id) => `document = "${id}"`).join(' || ')
		}) as unknown as SpecTagRecord[];

		for (const tagRec of tagRecords) {
			const existing = docTagsMap.get(tagRec.document) || [];
			existing.push(tagRec.tag);
			docTagsMap.set(tagRec.document, existing);
		}

		// Project-wide tag suggestions
		const allTagRecords = await adminPb.collection('spec_tags').getFullList({
			filter: `document.project = "${projectId}"`
		}) as unknown as SpecTagRecord[];

		allProjectTags = [...new Set(allTagRecords.map((t) => t.tag))].sort();
	}

	const docs: SpecDocumentWithTags[] = accessibleDocs.map((d) => ({
		...d,
		tags: docTagsMap.get(d.id) || []
	}));

	const users = await adminPb.collection('user').getFullList({
		sort: 'name'
	}) as unknown as UserRecord[];

	return {
		project,
		docs,
		allProjectTags,
		users,
		canManageProject: canManageProject(locals.user, project),
		tab,
		q,
		tagFilter
	};
};

export const actions: Actions = {
	createDoc: async ({ request, locals, params }) => {
		if (!locals.user) return fail(401);

		const { projectId } = params;

		const formData = await request.formData();
		const title = formData.get('title') as string;
		const body_md = formData.get('body_md') as string;
		const tagsRaw = formData.get('tags') as string;
		const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : [];

		const val = createDocSchema.safeParse({ title, body_md, tags });
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

		const doc = await adminPb.collection('spec_documents').create({
			project: projectId,
			title: val.data.title,
			body_md: val.data.body_md,
			created_by: locals.user.id,
			is_public_link: false
		});

		for (const tag of val.data.tags) {
			await adminPb.collection('spec_tags').create({
				document: doc.id,
				tag
			});
		}

		throw redirect(303, `/projects/${projectId}/specs/${doc.id}`);
	}
};

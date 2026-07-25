import type { SpecDocumentRecord, SpecPermissionRecord } from '$lib/server/specRecord';

export function canViewDocument(
	user: { id: string } | null | undefined,
	doc: SpecDocumentRecord,
	permissions: SpecPermissionRecord[]
): boolean {
	if (!user) return false;
	if (doc.created_by === user.id) return true;
	if (doc.is_public_link) return true;
	return permissions.some((p) => p.user === user.id && (p.role === 'view' || p.role === 'edit'));
}

export function canEditDocument(
	user: { id: string } | null | undefined,
	doc: SpecDocumentRecord,
	permissions: SpecPermissionRecord[]
): boolean {
	if (!user) return false;
	if (doc.created_by === user.id) return true;
	return permissions.some((p) => p.user === user.id && p.role === 'edit');
}

export function canDeleteDocument(
	user: { id: string } | null | undefined,
	doc: SpecDocumentRecord
): boolean {
	if (!user) return false;
	return doc.created_by === user.id;
}

export function canManagePermissions(
	user: { id: string } | null | undefined,
	doc: SpecDocumentRecord
): boolean {
	if (!user) return false;
	return doc.created_by === user.id;
}

export function filterDocumentsByAccess(
	user: { id: string } | null | undefined,
	docs: SpecDocumentRecord[],
	permissions: SpecPermissionRecord[]
): SpecDocumentRecord[] {
	if (!user) return [];
	return docs.filter((doc) => canViewDocument(user, doc, permissions));
}

export function isDocPublic(doc: SpecDocumentRecord): boolean {
	return doc.is_public_link;
}

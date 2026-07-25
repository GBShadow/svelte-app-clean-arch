import type { RetroRecord } from '$lib/server/retroRecord';

export interface Reorderable {
	id: string;
	position: number;
}

export function canViewRetro(
	user: { id: string; isAdmin: boolean } | null | undefined,
	project: { participants: string[] }
): boolean {
	if (!user) return false;
	if (user.isAdmin) return true;
	return project.participants.includes(user.id);
}

export function canManageRetro(
	user: { id: string; isAdmin: boolean } | null | undefined,
	project: { created_by: string; responsaveis: string[] }
): boolean {
	if (!user) return false;
	if (user.isAdmin) return true;
	return project.created_by === user.id || project.responsaveis.includes(user.id);
}

export function canParticipate(
	user: { id: string } | null | undefined,
	participants: { user: string }[]
): boolean {
	if (!user) return false;
	return participants.some((p) => p.user === user.id);
}

export function canModerate(
	user: { id: string; isAdmin: boolean } | null | undefined,
	project: { created_by: string; responsaveis: string[] }
): boolean {
	return canManageRetro(user, project);
}

export function isRetroFinalized(retro: RetroRecord): boolean {
	return retro.status === 'finalized';
}

export function canManageColumns(
	user: { id: string; isAdmin: boolean } | null | undefined,
	project: { created_by: string; responsaveis: string[] }
): boolean {
	return canManageRetro(user, project);
}

export function reorderPositions<T extends Reorderable>(
	items: T[],
	movedId: string,
	newPosition: number
): T[] {
	const movedItem = items.find((item) => item.id === movedId);
	if (!movedItem) return items;

	const remaining = items
		.filter((item) => item.id !== movedId)
		.sort((a, b) => a.position - b.position);

	const targetIndex = Math.max(0, Math.min(newPosition, remaining.length));
	remaining.splice(targetIndex, 0, movedItem);

	return remaining.map((item, index) => ({
		...item,
		position: index
	}));
}

export function recalculatePositions<T extends Reorderable>(items: T[]): T[] {
	return [...items]
		.sort((a, b) => a.position - b.position)
		.map((item, index) => ({
			...item,
			position: index
		}));
}

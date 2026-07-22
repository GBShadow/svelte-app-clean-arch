export interface KanbanColumnAccessInfo {
	type: 'backlog' | 'done' | 'custom';
}

export interface KanbanCardAccessInfo {
	created_by: string;
}

export function canCreateCard(
	user: { id: string; isAdmin: boolean } | null | undefined,
	project: { participants: string[] }
): boolean {
	if (!user) return false;
	if (user.isAdmin) return true;
	return project.participants.includes(user.id);
}

export function canUpdateCard(
	user: { id: string; isAdmin: boolean } | null | undefined,
	project: { participants: string[] }
): boolean {
	if (!user) return false;
	if (user.isAdmin) return true;
	return project.participants.includes(user.id);
}

export function canDeleteCard(userId: string | undefined, card: KanbanCardAccessInfo): boolean {
	if (!userId) return false;
	return card.created_by === userId;
}

export function canManageColumns(user: { isAdmin: boolean } | undefined | null): boolean {
	return !!user?.isAdmin;
}

export function canDeleteColumn(user: { isAdmin: boolean } | undefined | null, column: KanbanColumnAccessInfo): boolean {
	if (!user?.isAdmin) return false;
	return column.type === 'custom';
}

export interface Reorderable {
	id: string;
	position: number;
}

/**
 * Reordena uma lista de itens após a movimentação de um item para uma nova posição.
 * Garante que os números de posição sejam contíguos de 0 a N-1.
 */
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

/**
 * Recalcula as posições de uma lista de itens para garantir que sejam contíguas (ex: após remoção).
 */
export function recalculatePositions<T extends Reorderable>(items: T[]): T[] {
	return [...items]
		.sort((a, b) => a.position - b.position)
		.map((item, index) => ({
			...item,
			position: index
		}));
}

export type CategoryInfo = {
	id: string;
	name: string;
	description?: string;
};

export function canViewCategories(userId?: string | null): boolean {
	return Boolean(userId && userId.trim().length > 0);
}

export function canManageCategories(userId?: string | null): boolean {
	return Boolean(userId && userId.trim().length > 0);
}

export function formatCategoryBadge(category?: Partial<CategoryInfo> | { name?: string } | null): string {
	if (!category || !category.name) return '';
	return category.name.trim();
}

export function sortCategoriesByName<T extends { name: string }>(categories: T[]): T[] {
	return [...categories].sort((a, b) =>
		a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
	);
}

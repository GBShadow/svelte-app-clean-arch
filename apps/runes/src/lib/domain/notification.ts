export type NotificationType = 'chat' | 'system' | 'kanban' | 'poker';

export interface NotificationRecord {
	id: string;
	user: string;
	type: NotificationType;
	title: string;
	body: string;
	url?: string;
	read: boolean;
	metadata?: Record<string, unknown>;
	expiresAt?: string;
	created: string;
	updated: string;
	expand?: {
		user?: {
			id: string;
			name: string;
			avatar?: string;
			email: string;
		};
	};
}

export interface CreateNotificationPayload {
	type: NotificationType;
	title: string;
	body: string;
	url?: string;
	metadata?: Record<string, unknown>;
}

export function buildNotificationPayload(
	type: NotificationType,
	title: string,
	body: string,
	url?: string,
	metadata?: Record<string, unknown>
): CreateNotificationPayload {
	return { type, title, body, url, metadata };
}

export function truncatePreview(text: string, max = 120): string {
	if (text.length <= max) return text;
	return text.slice(0, max).trimEnd() + '\u2026';
}

export function isExpired(notification: NotificationRecord): boolean {
	if (!notification.expiresAt) return false;
	return new Date(notification.expiresAt) < new Date();
}

export function getTypeIcon(type: NotificationType): string {
	switch (type) {
		case 'chat':
			return 'MessageSquare';
		case 'system':
			return 'Bell';
		case 'kanban':
			return 'Kanban';
		case 'poker':
			return 'Users';
	}
}

export function getTypeLabel(type: NotificationType): string {
	switch (type) {
		case 'chat':
			return 'Chat';
		case 'system':
			return 'Sistema';
		case 'kanban':
			return 'Kanban';
		case 'poker':
			return 'Poker';
	}
}

export function isSafeRedirectUrl(url: string): boolean {
	if (!url) return true;
	if (!url.startsWith('/')) return false;
	if (url.includes('//')) return false;
	if (/^[a-z]+:/i.test(url)) return false;
	return true;
}

export function formatRelativeTime(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffSec = Math.floor(diffMs / 1000);
	const diffMin = Math.floor(diffSec / 60);
	const diffHour = Math.floor(diffMin / 60);
	const diffDay = Math.floor(diffHour / 24);

	if (diffSec < 60) return 'agora mesmo';
	if (diffMin < 60) return `há ${diffMin}min`;
	if (diffHour < 24) return `há ${diffHour}h`;
	if (diffDay < 7) return `há ${diffDay}d`;
	return date.toLocaleDateString('pt-BR');
}
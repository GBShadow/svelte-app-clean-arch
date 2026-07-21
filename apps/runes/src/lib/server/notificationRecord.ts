import type { RecordModel } from 'pocketbase';

export interface NotificationRecord extends RecordModel {
	user: string;
	type: 'chat' | 'system' | 'kanban' | 'poker';
	title: string;
	body: string;
	url?: string;
	read: boolean;
	metadata?: Record<string, unknown>;
	expiresAt?: string;
}
import { z } from 'zod';
import { isSafeRedirectUrl } from '$lib/domain/notification';

export const listQuerySchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	perPage: z.coerce.number().int().positive().max(100).default(20),
	type: z.enum(['chat', 'system', 'kanban', 'poker']).optional(),
	read: z.preprocess((val) => {
		if (val === 'true') return true;
		if (val === 'false') return false;
		return val;
	}, z.boolean().optional())
});

export const markReadSchema = z.object({
	ids: z.array(z.string().min(1)).min(1).max(100)
});

export const createNotificationSchema = z.object({
	type: z.enum(['chat', 'system', 'kanban', 'poker']),
	title: z.string().min(1).max(200),
	body: z.string().min(1).max(1000),
	url: z.string().optional().refine((url) => !url || isSafeRedirectUrl(url), 'URL deve ser path relativo same-origin'),
	metadata: z.record(z.string(), z.unknown()).optional()
});
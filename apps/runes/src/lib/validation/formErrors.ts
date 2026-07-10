import type { z } from 'zod';

export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
	const errors: Record<string, string> = {};
	for (const issue of error.issues) {
		const key = issue.path[0]?.toString() ?? 'general';
		if (!(key in errors)) errors[key] = issue.message;
	}
	return errors;
}

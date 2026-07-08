import type { RequestHandler } from './$types';
import { resetStore } from '$lib/server/todoStore';

/** Reseta o store em memória — uso exclusivo em e2e. */
export const POST: RequestHandler = async () => {
	resetStore();
	return new Response(null, { status: 204 });
};

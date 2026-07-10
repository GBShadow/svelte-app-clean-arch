import type { APIRequestContext } from '@playwright/test';

export const PB_API_URL = process.env.PB_API_URL ?? 'http://127.0.0.1:8090';
export const SEED_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'seed-admin@example.com';
export const SEED_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'changeme123456';

const SEED_BROKEN_MESSAGE =
	`Seed admin inválido no PocketBase (${SEED_EMAIL}).\n` +
	'Algum teste provavelmente alterou a senha do seed. Rode: pnpm backend:reset';

/**
 * Authenticates as the seed admin against the PocketBase REST API.
 * Returns the auth token, or null when the credentials no longer work.
 */
export async function authenticateSeedAdmin(
	request: APIRequestContext
): Promise<string | null> {
	const response = await request.post(`${PB_API_URL}/api/collections/auth/auth-with-password`, {
		data: { identity: SEED_EMAIL, password: SEED_PASSWORD },
		failOnStatusCode: false
	});

	if (!response.ok()) return null;

	const { token } = await response.json();
	return token ?? null;
}

/**
 * Fails the test immediately when the seed admin credentials no longer work,
 * instead of letting the UI login time out after 30s with an opaque error.
 */
export async function assertSeedAdmin(request: APIRequestContext): Promise<void> {
	const token = await authenticateSeedAdmin(request);
	if (!token) throw new Error(SEED_BROKEN_MESSAGE);
}

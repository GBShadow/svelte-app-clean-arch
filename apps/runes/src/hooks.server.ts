import { redirect, type Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { createServerClient } from '$lib/server/pocketbase';
import { isPasswordExpired } from '$lib/auth/passwordGate';
import type { AuthenticatedUser } from '$lib/server/authUser';

const PUBLIC_ROUTES = new Set(['/login']);
const PASSWORD_GATE_EXCLUDED_ROUTES = new Set(['/change-password', '/logout']);

export const handle: Handle = async ({ event, resolve }) => {
	const pb = createServerClient(event);
	event.locals.pb = pb;
	event.locals.user = null;

	try {
		if (pb.authStore.isValid) {
			const authRecord = await pb.collection('auth').authRefresh();
			const profile = await pb
				.collection('user')
				.getFirstListItem(pb.filter('email = {:email}', { email: authRecord.record.email }));

			event.locals.user = {
				id: profile.id,
				name: profile.name,
				email: profile.email,
				jobTitle: profile.jobTitle,
				isAdmin: authRecord.record.isAdmin,
				mustChangePassword: authRecord.record.mustChangePassword,
				passwordSetAt: authRecord.record.passwordSetAt || null
			} satisfies AuthenticatedUser;
		}
	} catch {
		pb.authStore.clear();
		event.locals.user = null;
	}

	const path = event.url.pathname;
	const user = event.locals.user;

	if (!user && !PUBLIC_ROUTES.has(path)) {
		throw redirect(303, '/login');
	}

	if (user && PUBLIC_ROUTES.has(path)) {
		throw redirect(303, '/');
	}

	if (
		user?.mustChangePassword &&
		isPasswordExpired(user.passwordSetAt) &&
		!PASSWORD_GATE_EXCLUDED_ROUTES.has(path)
	) {
		throw redirect(303, '/change-password');
	}

	const response = await resolve(event);

	response.headers.append(
		'set-cookie',
		pb.authStore.exportToCookie({
			secure: !dev,
			httpOnly: true,
			sameSite: 'lax',
			path: '/'
		})
	);

	return response;
};

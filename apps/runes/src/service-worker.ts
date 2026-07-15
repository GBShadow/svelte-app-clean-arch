/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { shouldSuppressChatPush, type WindowClientInfo } from '$lib/client/pushDecision';
import { isSafeRedirectUrl } from '$lib/domain/pushPayload';

declare const self: ServiceWorkerGlobalScope;

type PushPayload = {
	type: 'chat' | 'system';
	title: string;
	body: string;
	url: string;
	data?: Record<string, unknown>;
};

self.addEventListener('push', (event: PushEvent) => {
	if (!event.data) return;

	let payload: PushPayload;
	try {
		payload = event.data.json() as PushPayload;
	} catch {
		return;
	}

	event.waitUntil(handlePush(payload));
});

async function handlePush(payload: PushPayload): Promise<void> {
	if (!isSafeRedirectUrl(payload.url)) return;

	if (payload.type === 'chat') {
		const suppressed = await isRoomTabFocused(payload.url);
		if (suppressed) return;
	}

	await self.registration.showNotification(payload.title, {
		body: payload.body,
		data: { url: payload.url, ...payload.data }
	});
}

async function isRoomTabFocused(roomUrl: string): Promise<boolean> {
	const windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
	const clientInfos: WindowClientInfo[] = windowClients.map((client) => ({
		url: client.url,
		focused: (client as WindowClient).focused
	}));
	return shouldSuppressChatPush(clientInfos, roomUrl);
}

self.addEventListener('notificationclick', (event: NotificationEvent) => {
	event.notification.close();

	const url = event.notification.data?.url;
	if (typeof url !== 'string' || !isSafeRedirectUrl(url)) return;

	event.waitUntil(focusOrOpen(url));
});

async function focusOrOpen(url: string): Promise<void> {
	const target = new URL(url, self.location.origin).href;
	const windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

	for (const client of windowClients) {
		if (client.url === target && 'focus' in client) {
			await (client as WindowClient).focus();
			return;
		}
	}

	await self.clients.openWindow?.(url);
}

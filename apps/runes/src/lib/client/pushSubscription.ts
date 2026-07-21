import { PUBLIC_VAPID_PUBLIC_KEY } from '$env/static/public';

export type PushPermissionOutcome = 'granted' | 'denied' | 'default' | 'unsupported';

export function isPushSupported(): boolean {
	return (
		typeof window !== 'undefined' &&
		'serviceWorker' in navigator &&
		'PushManager' in window &&
		'Notification' in window
	);
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
	const rawData = atob(base64);
	return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

async function sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
	const json = subscription.toJSON();
	await fetch('/api/push/subscribe', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			endpoint: json.endpoint,
			keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth }
		})
	});
}

async function removeSubscriptionFromServer(endpoint: string): Promise<void> {
	await fetch('/api/push/unsubscribe', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ endpoint })
	});
}

/** RF1: solicita permissão nativa e, se concedida, registra a subscription no backend. */
export async function enablePushNotifications(): Promise<PushPermissionOutcome> {
	if (!isPushSupported()) return 'unsupported';

	const permission = await Notification.requestPermission();
	if (permission !== 'granted') return permission;

	const registration = await navigator.serviceWorker.ready;
	const subscription = await registration.pushManager.subscribe({
		userVisibleOnly: true,
		applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_PUBLIC_KEY) as BufferSource
	});

	await sendSubscriptionToServer(subscription);
	return 'granted';
}

/** RF10: revoga a subscription do dispositivo atual, no backend e no navegador. */
export async function disablePushNotifications(): Promise<void> {
	if (!isPushSupported()) return;

	const registration = await navigator.serviceWorker.ready;
	const subscription = await registration.pushManager.getSubscription();
	if (!subscription) return;

	await removeSubscriptionFromServer(subscription.endpoint);
	await subscription.unsubscribe();
}

/** Estado atual: se este dispositivo já tem uma subscription ativa registrada no navegador. */
export async function hasActiveSubscription(): Promise<boolean> {
	if (!isPushSupported()) return false;

	const registration = await navigator.serviceWorker.ready;
	const subscription = await registration.pushManager.getSubscription();
	return subscription !== null;
}

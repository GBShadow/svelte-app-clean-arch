export type AuthEventType = 'login' | 'logout';

const CHANNEL_NAME = 'auth';

function isSupported(): boolean {
	return typeof BroadcastChannel !== 'undefined';
}

export function postAuthEvent(type: AuthEventType): void {
	if (!isSupported()) return;

	const channel = new BroadcastChannel(CHANNEL_NAME);
	channel.postMessage(type);
	channel.close();
}

export function onAuthEvent(callback: (type: AuthEventType) => void): () => void {
	if (!isSupported()) return () => {};

	const channel = new BroadcastChannel(CHANNEL_NAME);
	const listener = (event: MessageEvent<AuthEventType>) => callback(event.data);

	channel.addEventListener('message', listener);

	return () => {
		channel.removeEventListener('message', listener);
		channel.close();
	};
}

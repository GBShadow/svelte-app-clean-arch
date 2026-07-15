export const CHAT_MESSAGE_PREVIEW_MAX_LENGTH = 120;
const MAX_SYSTEM_PUSH_PAYLOAD_BYTES = 4000;

// Aceita apenas paths relativos same-origin, começando com uma única "/" —
// bloqueia URLs absolutas (http:, javascript:, mailto:, nenhuma delas começa
// com "/") e protocol-relative ("//evil.com" ou "/\evil.com").
const SAFE_RELATIVE_URL_PATTERN = /^\/(?!\/|\\)/;

export type ChatPushPayload = {
	type: 'chat';
	title: string;
	body: string;
	url: string;
	data: { roomId: string; roomName: string };
};

export type SystemPushPayload = {
	type: 'system';
	title: string;
	body: string;
	url: string;
	data: Record<string, never>;
};

export function isSafeRedirectUrl(url: string): boolean {
	return typeof url === 'string' && SAFE_RELATIVE_URL_PATTERN.test(url);
}

export function truncateMessage(
	text: string,
	maxLength: number = CHAT_MESSAGE_PREVIEW_MAX_LENGTH
): string {
	if (text.length <= maxLength) return text;
	return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

export function buildChatPushPayload(params: {
	roomId: string;
	roomName: string;
	senderName: string;
	text: string;
}): ChatPushPayload {
	return {
		type: 'chat',
		title: params.senderName,
		body: truncateMessage(params.text),
		url: `/chat/${params.roomId}`,
		data: { roomId: params.roomId, roomName: params.roomName }
	};
}

/**
 * Retorna `null` quando a `url` não é same-origin ou o payload serializado
 * excede o limite prático (~4KB) do Web Push — cabe ao chamador decidir se
 * isso é um erro (RF5) ou um push silenciosamente ignorado.
 */
export function buildSystemPushPayload(params: {
	title: string;
	body: string;
	url: string;
}): SystemPushPayload | null {
	if (!isSafeRedirectUrl(params.url)) return null;

	const payload: SystemPushPayload = {
		type: 'system',
		title: params.title,
		body: params.body,
		url: params.url,
		data: {}
	};

	if (JSON.stringify(payload).length > MAX_SYSTEM_PUSH_PAYLOAD_BYTES) return null;

	return payload;
}

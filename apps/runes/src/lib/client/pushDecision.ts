export type WindowClientInfo = {
	url: string;
	focused: boolean;
};

/**
 * RF4: suprime a notificação de chat somente quando existe uma aba na URL
 * exata da sala E ela está focada. Aba aberta na sala mas sem foco não
 * suprime (AC7) — a decisão fica isolada aqui para ser testável sem `self`.
 */
export function shouldSuppressChatPush(clients: WindowClientInfo[], roomUrl: string): boolean {
	return clients.some((client) => client.focused && matchesRoomUrl(client.url, roomUrl));
}

function matchesRoomUrl(clientUrl: string, roomUrl: string): boolean {
	try {
		return new URL(clientUrl).pathname === roomUrl;
	} catch {
		return clientUrl === roomUrl;
	}
}

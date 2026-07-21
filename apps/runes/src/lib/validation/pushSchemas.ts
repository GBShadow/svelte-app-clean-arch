import { z } from 'zod';

// endpoint de subscribeSchema acaba virando o destino de um POST feito pelo
// servidor (webPush.ts → webpush.sendNotification). Sem restringir o host,
// um usuário autenticado poderia registrar um "endpoint" apontando para um
// serviço interno (SSRF) — o servidor faria a requisição por ele. A allowlist
// cobre os provedores de push conhecidos dos navegadores suportados.
const ALLOWED_PUSH_ENDPOINT_HOSTS = [
	'fcm.googleapis.com', // Chrome/Edge/Opera (Chromium)
	'android.googleapis.com', // Chrome legado
	'updates.push.services.mozilla.com', // Firefox
	'push.services.mozilla.com', // Firefox (variante antiga)
	'notify.windows.com', // Edge legado/IE
	'web.push.apple.com' // Safari
];

function isAllowedPushEndpoint(endpoint: string): boolean {
	let url: URL;
	try {
		url = new URL(endpoint);
	} catch {
		return false;
	}

	if (url.protocol !== 'https:') return false;

	return ALLOWED_PUSH_ENDPOINT_HOSTS.some(
		(host) => url.hostname === host || url.hostname.endsWith(`.${host}`)
	);
}

export const subscribeSchema = z.object({
	endpoint: z
		.url({ error: 'Endpoint de push inválido.' })
		.refine(isAllowedPushEndpoint, { error: 'Provedor de push não suportado.' }),
	keys: z.object({
		p256dh: z.string().min(1, { error: 'Chave p256dh obrigatória.' }),
		auth: z.string().min(1, { error: 'Chave auth obrigatória.' })
	})
});

export const unsubscribeSchema = z.object({
	endpoint: z.url({ error: 'Endpoint de push inválido.' })
});

export type SubscribeInput = z.infer<typeof subscribeSchema>;
export type UnsubscribeInput = z.infer<typeof unsubscribeSchema>;

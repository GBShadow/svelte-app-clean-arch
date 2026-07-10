const PASSWORD_GRACE_PERIOD_MS = 10 * 24 * 60 * 60 * 1000;

/**
 * `passwordSetAt` vazio/nulo é tratado como expirado: força a troca
 * imediatamente para quem ainda não tem a marca de tempo definida.
 */
export function isPasswordExpired(passwordSetAt: string | null, now: Date = new Date()): boolean {
	if (!passwordSetAt) return true;

	const setAt = new Date(passwordSetAt).getTime();
	if (Number.isNaN(setAt)) return true;

	return now.getTime() - setAt > PASSWORD_GRACE_PERIOD_MS;
}

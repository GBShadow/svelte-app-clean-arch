import crypto from 'node:crypto';

const TOKEN_BYTES = 32;
const HASH_ALGORITHM = 'sha256';

export function generateEditToken(): { token: string; hash: string } {
	const token = crypto.randomBytes(TOKEN_BYTES).toString('hex');
	const hash = crypto.createHash(HASH_ALGORITHM).update(token).digest('hex');
	return { token, hash };
}

export function verifyEditToken(token: string, hash: string | null): boolean {
	if (!hash) return false;
	const computedHash = crypto.createHash(HASH_ALGORITHM).update(token).digest('hex');
	return computedHash === hash;
}

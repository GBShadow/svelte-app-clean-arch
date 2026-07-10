import { describe, expect, test } from 'vitest';
import { isPasswordExpired } from './passwordGate';

describe('isPasswordExpired', () => {
	test('retorna true quando passwordSetAt é nulo', () => {
		expect(isPasswordExpired(null)).toBe(true);
	});

	test('retorna true quando passwordSetAt é string vazia', () => {
		expect(isPasswordExpired('')).toBe(true);
	});

	test('retorna true quando passwordSetAt está há mais de 10 dias', () => {
		const now = new Date('2026-07-09T00:00:00.000Z');
		const passwordSetAt = new Date('2026-06-28T00:00:00.000Z').toISOString(); // 11 dias antes

		expect(isPasswordExpired(passwordSetAt, now)).toBe(true);
	});

	test('retorna false quando passwordSetAt está dentro de 10 dias', () => {
		const now = new Date('2026-07-09T00:00:00.000Z');
		const passwordSetAt = new Date('2026-07-06T00:00:00.000Z').toISOString(); // 3 dias antes

		expect(isPasswordExpired(passwordSetAt, now)).toBe(false);
	});

	test('retorna false exatamente na borda dos 10 dias', () => {
		const now = new Date('2026-07-09T00:00:00.000Z');
		const passwordSetAt = new Date('2026-06-29T00:00:00.000Z').toISOString(); // exatamente 10 dias antes

		expect(isPasswordExpired(passwordSetAt, now)).toBe(false);
	});

	test('retorna true quando passwordSetAt não é uma data válida', () => {
		expect(isPasswordExpired('não-é-uma-data')).toBe(true);
	});
});

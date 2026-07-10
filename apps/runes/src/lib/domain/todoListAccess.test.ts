import { describe, expect, test } from 'vitest';
import { canView, canWrite } from './todoListAccess';

describe('canView', () => {
	test('dono sempre pode ver a própria lista', () => {
		expect(canView({ ownerId: 'user-1', public: false }, 'user-1')).toBe(true);
	});

	test('não-dono pode ver lista pública', () => {
		expect(canView({ ownerId: 'user-1', public: true }, 'user-2')).toBe(true);
	});

	test('não-dono não pode ver lista privada', () => {
		expect(canView({ ownerId: 'user-1', public: false }, 'user-2')).toBe(false);
	});
});

describe('canWrite', () => {
	test('dono pode escrever mesmo em lista privada', () => {
		expect(canWrite({ ownerId: 'user-1', public: false }, 'user-1')).toBe(true);
	});

	test('não-dono não pode escrever mesmo em lista pública', () => {
		expect(canWrite({ ownerId: 'user-1', public: true }, 'user-2')).toBe(false);
	});
});

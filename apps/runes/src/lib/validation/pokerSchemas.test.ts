import { describe, it, expect } from 'vitest';
import {
	createRoomSchema,
	createTaskSchema,
	voteSchema,
	setFinalPointsSchema,
	changeRoleSchema
} from './pokerSchemas';

describe('Planning Poker Validation Schemas', () => {
	describe('createRoomSchema', () => {
		it('deve validar nomes corretos', () => {
			const res = createRoomSchema.safeParse({ name: 'Sala Scrum', projectId: 'proj-1' });
			expect(res.success).toBe(true);
		});

		it('deve rejeitar nome vazio', () => {
			const res = createRoomSchema.safeParse({ name: '', projectId: 'proj-1' });
			expect(res.success).toBe(false);
			if (!res.success) {
				expect(res.error.issues[0].message).toBe('O nome da sala é obrigatório.');
			}
		});
	});

	describe('createTaskSchema', () => {
		it('deve validar tasks corretas', () => {
			const res = createTaskSchema.safeParse({ title: 'Task 1', description: '<p>Detalhes</p>' });
			expect(res.success).toBe(true);
		});

		it('deve rejeitar título vazio', () => {
			const res = createTaskSchema.safeParse({ title: '' });
			expect(res.success).toBe(false);
		});
	});

	describe('voteSchema', () => {
		it('deve aceitar valores Fibonacci, ?, ☕', () => {
			expect(voteSchema.safeParse({ value: '5' }).success).toBe(true);
			expect(voteSchema.safeParse({ value: '?' }).success).toBe(true);
			expect(voteSchema.safeParse({ value: '☕' }).success).toBe(true);
		});

		it('deve rejeitar outros valores', () => {
			expect(voteSchema.safeParse({ value: '4' }).success).toBe(false);
			expect(voteSchema.safeParse({ value: 'invalid' }).success).toBe(false);
		});
	});

	describe('setFinalPointsSchema', () => {
		it('deve aceitar números válidos ou null', () => {
			expect(setFinalPointsSchema.safeParse({ points: 8 }).success).toBe(true);
			expect(setFinalPointsSchema.safeParse({ points: null }).success).toBe(true);
		});

		it('deve rejeitar números negativos ou gigantes', () => {
			expect(setFinalPointsSchema.safeParse({ points: -5 }).success).toBe(false);
			expect(setFinalPointsSchema.safeParse({ points: 1000 }).success).toBe(false);
		});
	});

	describe('changeRoleSchema', () => {
		it('deve aceitar papéis válidos', () => {
			expect(changeRoleSchema.safeParse({ participantId: 'p1', role: 'admin' }).success).toBe(true);
			expect(changeRoleSchema.safeParse({ participantId: 'p1', role: 'voter' }).success).toBe(true);
			expect(changeRoleSchema.safeParse({ participantId: 'p1', role: 'spectator' }).success).toBe(true);
		});

		it('deve rejeitar papéis inválidos', () => {
			expect(changeRoleSchema.safeParse({ participantId: 'p1', role: 'other' }).success).toBe(false);
		});
	});
});

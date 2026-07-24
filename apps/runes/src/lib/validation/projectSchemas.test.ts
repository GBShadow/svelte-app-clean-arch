import { describe, expect, test } from 'vitest';
import {
	createProjectSchema,
	updateProjectSchema,
	createSprintSchema,
	addParticipantSchema
} from './projectSchemas';

describe('createProjectSchema', () => {
	test('aceita dados válidos com todos os campos', () => {
		const result = createProjectSchema.safeParse({
			title: 'Meu Projeto',
			description: 'Descrição do projeto',
			responsaveisIds: ['user1', 'user2'],
			participantIds: ['user3']
		});
		expect(result.success).toBe(true);
	});

	test('aceita dados válidos sem arrays opcionais', () => {
		const result = createProjectSchema.safeParse({
			title: 'Meu Projeto',
			description: 'Descrição do projeto'
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.responsaveisIds).toEqual([]);
			expect(result.data.participantIds).toEqual([]);
		}
	});

	test('rejeita título vazio', () => {
		const result = createProjectSchema.safeParse({
			title: '',
			description: 'Descrição'
		});
		expect(result.success).toBe(false);
	});

	test('rejeita título muito longo', () => {
		const result = createProjectSchema.safeParse({
			title: 'A'.repeat(201),
			description: 'Descrição'
		});
		expect(result.success).toBe(false);
	});

	test('rejeita descrição vazia', () => {
		const result = createProjectSchema.safeParse({
			title: 'Projeto',
			description: ''
		});
		expect(result.success).toBe(false);
	});

	test('rejeita descrição muito longa', () => {
		const result = createProjectSchema.safeParse({
			title: 'Projeto',
			description: 'A'.repeat(5001)
		});
		expect(result.success).toBe(false);
	});
});

describe('updateProjectSchema', () => {
	test('aceita dados completos', () => {
		const result = updateProjectSchema.safeParse({
			title: 'Novo Título',
			description: 'Nova descrição'
		});
		expect(result.success).toBe(true);
	});

	test('aceita apenas título (descrição opcional)', () => {
		const result = updateProjectSchema.safeParse({ title: 'Só título' });
		expect(result.success).toBe(true);
	});

	test('aceita apenas descrição (título opcional)', () => {
		const result = updateProjectSchema.safeParse({ description: 'Só descrição' });
		expect(result.success).toBe(true);
	});

	test('aceita objeto vazio (tudo opcional)', () => {
		const result = updateProjectSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	test('rejeita título vazio quando fornecido', () => {
		const result = updateProjectSchema.safeParse({ title: '' });
		expect(result.success).toBe(false);
	});

	test('rejeita título muito longo', () => {
		const result = updateProjectSchema.safeParse({ title: 'A'.repeat(201) });
		expect(result.success).toBe(false);
	});

	test('rejeita descrição vazia quando fornecida', () => {
		const result = updateProjectSchema.safeParse({ description: '' });
		expect(result.success).toBe(false);
	});

	test('rejeita descrição muito longa', () => {
		const result = updateProjectSchema.safeParse({ description: 'A'.repeat(5001) });
		expect(result.success).toBe(false);
	});
});

describe('createSprintSchema', () => {
	test('aceita dados válidos', () => {
		const result = createSprintSchema.safeParse({
			title: 'Sprint 1',
			startDate: '2026-08-01',
			endDate: '2026-08-14'
		});
		expect(result.success).toBe(true);
	});

	test('rejeita título vazio', () => {
		const result = createSprintSchema.safeParse({
			title: '',
			startDate: '2026-08-01',
			endDate: '2026-08-14'
		});
		expect(result.success).toBe(false);
	});

	test('rejeita título muito longo', () => {
		const result = createSprintSchema.safeParse({
			title: 'A'.repeat(201),
			startDate: '2026-08-01',
			endDate: '2026-08-14'
		});
		expect(result.success).toBe(false);
	});

	test('rejeita startDate vazio', () => {
		const result = createSprintSchema.safeParse({
			title: 'Sprint 1',
			startDate: '',
			endDate: '2026-08-14'
		});
		expect(result.success).toBe(false);
	});

	test('rejeita endDate vazio', () => {
		const result = createSprintSchema.safeParse({
			title: 'Sprint 1',
			startDate: '2026-08-01',
			endDate: ''
		});
		expect(result.success).toBe(false);
	});
});

describe('addParticipantSchema', () => {
	test('aceita userId válido', () => {
		const result = addParticipantSchema.safeParse({ userId: 'abc123' });
		expect(result.success).toBe(true);
	});

	test('rejeita userId vazio', () => {
		const result = addParticipantSchema.safeParse({ userId: '' });
		expect(result.success).toBe(false);
	});
});

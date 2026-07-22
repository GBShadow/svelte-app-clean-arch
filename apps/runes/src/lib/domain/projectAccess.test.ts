import { describe, expect, test } from 'vitest';
import {
	canViewProject,
	canManageProject,
	canCreateProject,
	canDeleteProject,
	getTargetSprint,
	getActiveSprint
} from './projectAccess';
import type { SprintRecord } from '$lib/server/projectRecord';

const adminUser = { id: 'admin1', isAdmin: true };
const normalUser = { id: 'user1', isAdmin: false };
const otherUser = { id: 'user2', isAdmin: false };

const mockProject = {
	created_by: 'user1',
	responsaveis: ['user1'],
	participants: ['user1', 'user2']
};

describe('projectAccess', () => {
	describe('canViewProject', () => {
		test('admin pode ver qualquer projeto', () => {
			expect(canViewProject(adminUser, { participants: [] })).toBe(true);
		});

		test('participante pode ver o projeto', () => {
			expect(canViewProject(normalUser, mockProject)).toBe(true);
		});

		test('não-participante não pode ver', () => {
			expect(canViewProject({ id: 'outsider', isAdmin: false }, mockProject)).toBe(false);
		});

		test('usuário não logado não pode ver', () => {
			expect(canViewProject(null, mockProject)).toBe(false);
		});
	});

	describe('canManageProject', () => {
		test('admin pode gerenciar qualquer projeto', () => {
			expect(canManageProject(adminUser, mockProject)).toBe(true);
		});

		test('criador pode gerenciar', () => {
			expect(canManageProject(normalUser, mockProject)).toBe(true);
		});

		test('responsável pode gerenciar', () => {
			expect(canManageProject({ id: 'responsavel1', isAdmin: false }, {
				...mockProject,
				created_by: 'outro',
				responsaveis: ['responsavel1']
			})).toBe(true);
		});

		test('participante comum não pode gerenciar', () => {
			expect(canManageProject(otherUser, mockProject)).toBe(false);
		});
	});

	describe('canCreateProject', () => {
		test('admin pode criar', () => {
			expect(canCreateProject(adminUser)).toBe(true);
		});

		test('não-admin não pode criar', () => {
			expect(canCreateProject(normalUser)).toBe(false);
		});
	});

	describe('canDeleteProject', () => {
		test('admin pode deletar qualquer projeto', () => {
			expect(canDeleteProject(adminUser, mockProject)).toBe(true);
		});

		test('criador pode deletar', () => {
			expect(canDeleteProject(normalUser, mockProject)).toBe(true);
		});

		test('não-criador não pode deletar', () => {
			expect(canDeleteProject(otherUser, mockProject)).toBe(false);
		});
	});

	describe('getTargetSprint', () => {
		const projectId = 'proj1';
		const sprints: SprintRecord[] = [
			{ id: 's1', title: 'Sprint 1', project: projectId, startDate: '2026-01-01', endDate: '2026-01-14', status: 'finished', created: '', updated: '' },
			{ id: 's2', title: 'Sprint 2', project: projectId, startDate: '2026-01-15', endDate: '2026-01-28', status: 'active', created: '', updated: '' },
			{ id: 's3', title: 'Sprint 3', project: projectId, startDate: '2026-01-29', endDate: '2026-02-11', status: 'planned', created: '', updated: '' }
		];

		test('retorna sprint ativa primeiro', () => {
			const result = getTargetSprint(projectId, sprints);
			expect(result).not.toBeNull();
			expect(result!.sprint.id).toBe('s2');
			expect(result!.targetStatus).toBe('active');
		});

		test('retorna planned se não há active', () => {
			const withoutActive = sprints.filter((s) => s.id !== 's2');
			const result = getTargetSprint(projectId, withoutActive);
			expect(result).not.toBeNull();
			expect(result!.sprint.id).toBe('s3');
			expect(result!.targetStatus).toBe('planned');
		});

		test('retorna null se não há active nem planned', () => {
			const result = getTargetSprint(projectId, sprints.filter((s) => s.status === 'finished'));
			expect(result).toBeNull();
		});
	});

	describe('getActiveSprint', () => {
		const projectId = 'proj1';
		const sprints: SprintRecord[] = [
			{ id: 's1', title: 'Sprint 1', project: projectId, startDate: '', endDate: '', status: 'finished', created: '', updated: '' },
			{ id: 's2', title: 'Sprint 2', project: projectId, startDate: '', endDate: '', status: 'active', created: '', updated: '' }
		];

		test('retorna sprint ativa', () => {
			expect(getActiveSprint(projectId, sprints)?.id).toBe('s2');
		});

		test('retorna null se não há ativa', () => {
			expect(getActiveSprint(projectId, [])).toBeNull();
		});
	});
});

import { describe, it, expect } from 'vitest';
import {
	canVote,
	canReveal,
	canManageRoom,
	averageOfNumericVotes,
	calculateVoteDistribution,
	checkIfAllVotersVoted
} from './planningPokerAccess';

describe('Planning Poker Access Rules', () => {
	describe('canVote', () => {
		it('deve permitir votantes se os votos não estiverem revelados', () => {
			expect(canVote('voter', false)).toBe(true);
			expect(canVote('admin', false)).toBe(true);
		});

		it('deve rejeitar espectador de votar', () => {
			expect(canVote('spectator', false)).toBe(false);
			expect(canVote('spectator', true)).toBe(false);
		});

		it('deve rejeitar votar se já foi revelado', () => {
			expect(canVote('voter', true)).toBe(false);
			expect(canVote('admin', true)).toBe(false);
		});
	});

	describe('canReveal', () => {
		it('admin/responsável deve poder revelar a qualquer momento', () => {
			expect(canReveal('admin', false)).toBe(true);
			expect(canReveal('admin', true)).toBe(true);
		});

		it('voter comum só pode revelar se todos os votantes votaram', () => {
			expect(canReveal('voter', false)).toBe(false);
			expect(canReveal('voter', true)).toBe(true);
		});

		it('espectador nunca pode revelar', () => {
			expect(canReveal('spectator', false)).toBe(false);
			expect(canReveal('spectator', true)).toBe(false);
		});
	});

	describe('canManageRoom', () => {
		it('somente admin pode gerenciar', () => {
			expect(canManageRoom('admin')).toBe(true);
			expect(canManageRoom('voter')).toBe(false);
			expect(canManageRoom('spectator')).toBe(false);
		});
	});

	describe('averageOfNumericVotes', () => {
		it('deve calcular a média correta', () => {
			const votes = [{ value: '5' }, { value: '8' }, { value: '13' }];
			expect(averageOfNumericVotes(votes)).toBe(8.7);
		});

		it('deve ignorar valores não numéricos (? e ☕)', () => {
			const votes = [{ value: '5' }, { value: '?' }, { value: '8' }, { value: '☕' }];
			expect(averageOfNumericVotes(votes)).toBe(6.5);
		});

		it('deve retornar 0 se não houver votos numéricos', () => {
			const votes = [{ value: '?' }, { value: '☕' }];
			expect(averageOfNumericVotes(votes)).toBe(0);
			expect(averageOfNumericVotes([])).toBe(0);
		});
	});

	describe('calculateVoteDistribution', () => {
		it('deve mapear a distribuição corretamente', () => {
			const votes = [
				{ value: '5' },
				{ value: '5' },
				{ value: '8' },
				{ value: '☕' },
				{ value: '5' }
			];
			expect(calculateVoteDistribution(votes)).toEqual({
				'5': 3,
				'8': 1,
				'☕': 1
			});
		});
	});

	describe('checkIfAllVotersVoted', () => {
		it('deve retornar true se todos votantes ativos votaram', () => {
			const participants = [
				{ id: '1', role: 'admin' as const, is_online: true, has_left: false, user: 'u1' },
				{ id: '2', role: 'voter' as const, is_online: true, has_left: false, user: 'u2' },
				{ id: '3', role: 'voter' as const, is_online: true, has_left: false, user: 'u3' },
				{ id: '4', role: 'spectator' as const, is_online: true, has_left: false, user: 'u4' }
			];
			const votes = [{ user: 'u2' }, { user: 'u3' }];
			expect(checkIfAllVotersVoted(participants, votes)).toBe(true);
		});

		it('deve retornar false se falta algum votante online votar', () => {
			const participants = [
				{ id: '1', role: 'voter' as const, is_online: true, has_left: false, user: 'u1' },
				{ id: '2', role: 'voter' as const, is_online: true, has_left: false, user: 'u2' }
			];
			const votes = [{ user: 'u1' }];
			expect(checkIfAllVotersVoted(participants, votes)).toBe(false);
		});

		it('deve ignorar votantes offline ou que saíram', () => {
			const participants = [
				{ id: '1', role: 'voter' as const, is_online: true, has_left: false, user: 'u1' },
				{ id: '2', role: 'voter' as const, is_online: false, has_left: false, user: 'u2' },
				{ id: '3', role: 'voter' as const, is_online: true, has_left: true, user: 'u3' }
			];
			const votes = [{ user: 'u1' }];
			expect(checkIfAllVotersVoted(participants, votes)).toBe(true);
		});
	});
});

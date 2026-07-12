import { describe, it, expect, vi } from 'vitest';
import { PlanningPokerRoom } from './PlanningPokerRoom.svelte';
import type { PokerRoomRecord, PokerTaskRecord, PokerParticipantRecord, PokerVoteRecord } from '../server/pokerRecord';

describe('PlanningPokerRoom Reactive State Class', () => {
	const mockRoom: PokerRoomRecord = {
		id: 'room-1',
		name: 'Poker Test',
		created_by: 'user-admin',
		current_task: 'task-1',
		revealed: false,
		created: '',
		updated: ''
	};

	const mockParticipants: PokerParticipantRecord[] = [
		{
			id: 'part-1',
			room: 'room-1',
			user: 'user-admin',
			role: 'admin',
			is_online: true,
			has_voted: false,
			has_left: false,
			created: '',
			updated: ''
		},
		{
			id: 'part-2',
			room: 'room-1',
			user: 'user-voter',
			role: 'voter',
			is_online: true,
			has_voted: false,
			has_left: false,
			created: '',
			updated: ''
		}
	];

	const mockTasks: PokerTaskRecord[] = [
		{
			id: 'task-1',
			room: 'room-1',
			title: 'Task Alpha',
			description: 'Description Alpha',
			final_points: null,
			status: 'backlog',
			exported_card: null,
			created: '',
			updated: ''
		}
	];

	const mockVotes: PokerVoteRecord[] = [];

	it('deve inicializar com o estado correto', () => {
		const subscribeFn = vi.fn().mockReturnValue({
			unsubRoom: vi.fn(),
			unsubParticipants: vi.fn(),
			unsubTasks: vi.fn(),
			unsubVotes: vi.fn(),
			refetchVotes: vi.fn().mockResolvedValue([])
		});

		const pPoker = new PlanningPokerRoom(
			mockRoom,
			mockParticipants,
			mockTasks,
			mockVotes,
			'user-voter',
			subscribeFn
		);

		expect(pPoker.room?.name).toBe('Poker Test');
		expect(pPoker.currentTask?.title).toBe('Task Alpha');
		expect(pPoker.myParticipant?.role).toBe('voter');
		expect(pPoker.numericAverage).toBe(0);
	});

	it('deve atualizar o estado ao disparar callbacks de subscription', async () => {
		let triggerRoom: any;
		let triggerParticipant: any;
		let triggerTask: any;
		let triggerVote: any;

		const refetchMock = vi.fn().mockResolvedValue([{ id: 'v-1', room: 'room-1', task: 'task-1', user: 'user-voter', value: '5', created: '', updated: '' }]);

		const subscribeFn = (
			onRoom: any,
			onParticipant: any,
			onTask: any,
			onVote: any
		) => {
			triggerRoom = onRoom;
			triggerParticipant = onParticipant;
			triggerTask = onTask;
			triggerVote = onVote;
			return {
				unsubRoom: vi.fn(),
				unsubParticipants: vi.fn(),
				unsubTasks: vi.fn(),
				unsubVotes: vi.fn(),
				refetchVotes: refetchMock
			};
		};

		const pPoker = new PlanningPokerRoom(
			mockRoom,
			mockParticipants,
			mockTasks,
			mockVotes,
			'user-voter',
			subscribeFn
		);

		// Dispara update na sala mudando revealed para true (deve rodar refetch)
		await triggerRoom({ ...mockRoom, revealed: true });
		expect(pPoker.room?.revealed).toBe(true);
		expect(refetchMock).toHaveBeenCalled();
		expect(pPoker.votes.length).toBe(1);
		expect(pPoker.numericAverage).toBe(5);

		// Dispara novo participante
		triggerParticipant({
			id: 'part-3',
			room: 'room-1',
			user: 'user-voter2',
			role: 'voter',
			is_online: true,
			has_voted: true,
			has_left: false,
			created: '',
			updated: ''
		});
		expect(pPoker.participants.length).toBe(3);

		// Dispara novo voto
		triggerVote({
			id: 'v-2',
			room: 'room-1',
			task: 'task-1',
			user: 'user-voter2',
			value: '8',
			created: '',
			updated: ''
		});
		expect(pPoker.votes.length).toBe(2);
		expect(pPoker.numericAverage).toBe(6.5);
	});
});

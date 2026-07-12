import type { PokerRoomRecord, PokerTaskRecord, PokerParticipantRecord, PokerVoteRecord } from '../server/pokerRecord';
import { averageOfNumericVotes, calculateVoteDistribution, checkIfAllVotersVoted } from './planningPokerAccess';

export class PlanningPokerRoom {
	// Estados reativos usando runes de Svelte 5
	room = $state<PokerRoomRecord>();
	participants = $state<PokerParticipantRecord[]>([]);
	tasks = $state<PokerTaskRecord[]>([]);
	votes = $state<PokerVoteRecord[]>([]);

	private userId: string;
	private unsubscribeRoom?: () => void;
	private unsubscribeParticipants?: () => void;
	private unsubscribeTasks?: () => void;
	private unsubscribeVotes?: () => void;

	constructor(
		initialRoom: PokerRoomRecord,
		initialParticipants: PokerParticipantRecord[],
		initialTasks: PokerTaskRecord[],
		initialVotes: PokerVoteRecord[],
		userId: string,
		subscribeFn: (
			onRoom: (room: PokerRoomRecord) => void,
			onParticipant: (participant: PokerParticipantRecord) => void,
			onTask: (task: PokerTaskRecord) => void,
			onVote: (vote: PokerVoteRecord) => void
		) => {
			unsubRoom: () => void;
			unsubParticipants: () => void;
			unsubTasks: () => void;
			unsubVotes: () => void;
			refetchVotes: () => Promise<PokerVoteRecord[]>;
		}
	) {
		this.room = initialRoom;
		this.participants = initialParticipants;
		this.tasks = initialTasks;
		this.votes = initialVotes;
		this.userId = userId;

		let refetchVotesImpl: () => Promise<PokerVoteRecord[]> = () => Promise.resolve(this.votes);

		// Abre as subscriptions em realtime
		const callbacks = subscribeFn(
			// On Room update
			async (updatedRoom) => {
				const oldRevealed = this.room?.revealed;
				this.room = updatedRoom;

				// Se mudou para revelado, faz refetch dos votos (pois antes eram omitidos pelo PocketBase)
				if (!oldRevealed && updatedRoom.revealed) {
					try {
						const freshVotes = await refetchVotesImpl();
						this.votes = freshVotes;
					} catch (e) {
						console.error('Falha ao refetch dos votos após revelação:', e);
					}
				}
			},
			// On Participant change
			(p) => {
				const idx = this.participants.findIndex((item) => item.id === p.id);
				if (idx >= 0) {
					this.participants[idx] = p;
				} else {
					this.participants.push(p);
				}
			},
			// On Task change
			(t) => {
				const idx = this.tasks.findIndex((item) => item.id === t.id);
				if (idx >= 0) {
					this.tasks[idx] = t;
				} else {
					this.tasks.push(t);
				}
			},
			// On Vote change
			(v) => {
				// Remove voto antigo do mesmo usuário (se houver) para evitar duplicatas por ID ou usuário
				this.votes = this.votes.filter((item) => item.id !== v.id && item.user !== v.user);
				this.votes.push(v);
			}
		);

		// Armazena as funções de cancelamento de assinatura e o refetch
		this.unsubscribeRoom = callbacks.unsubRoom;
		this.unsubscribeParticipants = callbacks.unsubParticipants;
		this.unsubscribeTasks = callbacks.unsubTasks;
		this.unsubscribeVotes = callbacks.unsubVotes;
		refetchVotesImpl = callbacks.refetchVotes;
	}

	destroy() {
		this.unsubscribeRoom?.();
		this.unsubscribeParticipants?.();
		this.unsubscribeTasks?.();
		this.unsubscribeVotes?.();
	}

	// Getters computados reativos
	get currentTask(): PokerTaskRecord | undefined {
		if (!this.room?.current_task) return undefined;
		return this.tasks.find((t) => t.id === this.room?.current_task);
	}

	get myParticipant(): PokerParticipantRecord | undefined {
		return this.participants.find((p) => p.user === this.userId && !p.has_left);
	}

	get activeVoters(): PokerParticipantRecord[] {
		return this.participants.filter((p) => p.role === 'voter' && p.is_online && !p.has_left);
	}

	get numericAverage(): number {
		return averageOfNumericVotes(this.votes);
	}

	get distribution(): Record<string, number> {
		return calculateVoteDistribution(this.votes);
	}

	get allVotersVoted(): boolean {
		return checkIfAllVotersVoted(this.participants, this.votes);
	}
}

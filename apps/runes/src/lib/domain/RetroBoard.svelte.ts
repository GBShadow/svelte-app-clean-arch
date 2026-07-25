import type {
	RetroRecord,
	RetroColumnRecord,
	RetroCardRecord,
	RetroParticipantRecord
} from '$lib/server/retroRecord';
import type { ProjectRecord, SprintRecord } from '$lib/server/projectRecord';

export type RetroSubscribe = (
	onRetroEvent: (event: { action: string; record: RetroRecord }) => void,
	onColumnEvent: (event: { action: string; record: RetroColumnRecord }) => void,
	onCardEvent: (event: { action: string; record: RetroCardRecord }) => void,
	onParticipantEvent: (event: { action: string; record: RetroParticipantRecord }) => void
) => () => void;

export class RetroBoard {
	#retro = $state<RetroRecord | null>(null);
	#columns = $state<RetroColumnRecord[]>([]);
	#cards = $state<RetroCardRecord[]>([]);
	#participants = $state<RetroParticipantRecord[]>([]);
	#project = $state<ProjectRecord | null>(null);
	#sprint = $state<SprintRecord | null>(null);
	#editTokens = $state<Map<string, string>>(new Map());

	#subscribeFn: RetroSubscribe;
	#unsubscribe: (() => void) | null = null;

	constructor(
		subscribeFn: RetroSubscribe,
		retro: RetroRecord | null = null,
		columns: RetroColumnRecord[] = [],
		cards: RetroCardRecord[] = [],
		participants: RetroParticipantRecord[] = [],
		project: ProjectRecord | null = null,
		sprint: SprintRecord | null = null,
		editTokens: Map<string, string> = new Map()
	) {
		this.#subscribeFn = subscribeFn;
		this.#retro = retro;
		this.#columns = columns;
		this.#cards = cards;
		this.#participants = participants;
		this.#project = project;
		this.#sprint = sprint;
		this.#editTokens = editTokens;
	}

	get retro(): RetroRecord | null {
		return this.#retro;
	}

	get columns(): RetroColumnRecord[] {
		return [...this.#columns].sort((a, b) => a.position - b.position);
	}

	get cards(): RetroCardRecord[] {
		return [...this.#cards].sort((a, b) => a.position - b.position);
	}

	get participants(): RetroParticipantRecord[] {
		return [...this.#participants];
	}

	get project(): ProjectRecord | null {
		return this.#project;
	}

	get sprint(): SprintRecord | null {
		return this.#sprint;
	}

	get editTokens(): Map<string, string> {
		return this.#editTokens;
	}

	get isFinalized(): boolean {
		return this.#retro?.status === 'finalized';
	}

	get isParticipant(): boolean {
		if (!this.#project || !this.#project.expand?.participants) return false;
		return this.#project.participants.includes(this.#project.expand.participants[0]?.id ?? '');
	}

	start(): void {
		this.#unsubscribe = this.#subscribeFn(
			(retroEvent) => this.#handleRetroEvent(retroEvent),
			(colEvent) => this.#handleColumnEvent(colEvent),
			(cardEvent) => this.#handleCardEvent(cardEvent),
			(partEvent) => this.#handleParticipantEvent(partEvent)
		);
	}

	stop(): void {
		this.#unsubscribe?.();
		this.#unsubscribe = null;
	}

	sync(
		retro: RetroRecord | null,
		columns: RetroColumnRecord[],
		cards: RetroCardRecord[],
		participants: RetroParticipantRecord[],
		project?: ProjectRecord | null,
		sprint?: SprintRecord | null
	): void {
		this.#retro = retro;
		this.#columns = columns;
		this.#cards = cards;
		this.#participants = participants;
		if (project !== undefined) this.#project = project;
		if (sprint !== undefined) this.#sprint = sprint;
	}

	updateEditTokens(tokens: Map<string, string>): void {
		this.#editTokens = tokens;
	}

	#handleRetroEvent(event: { action: string; record: RetroRecord }): void {
		if (event.action === 'update') {
			this.#retro = event.record;
		}
	}

	#handleColumnEvent(event: { action: string; record: RetroColumnRecord }): void {
		if (this.#retro && event.record.retro !== this.#retro.id) return;

		if (event.action === 'create') {
			if (this.#columns.some((c) => c.id === event.record.id)) return;
			this.#columns = [...this.#columns, event.record];
		} else if (event.action === 'update') {
			this.#columns = this.#columns.map((c) =>
				c.id === event.record.id ? event.record : c
			);
		} else if (event.action === 'delete') {
			this.#columns = this.#columns.filter((c) => c.id !== event.record.id);
		}
	}

	#handleCardEvent(event: { action: string; record: RetroCardRecord }): void {
		if (this.#retro && event.record.retro !== this.#retro.id) return;

		const safeRecord = { ...event.record, edit_token_hash: null as string | null };

		if (event.action === 'create') {
			if (this.#cards.some((c) => c.id === event.record.id)) return;
			this.#cards = [...this.#cards, safeRecord];
		} else if (event.action === 'update') {
			this.#cards = this.#cards.map((c) =>
				c.id === event.record.id ? safeRecord : c
			);
		} else if (event.action === 'delete') {
			this.#cards = this.#cards.filter((c) => c.id !== event.record.id);
		}
	}

	#handleParticipantEvent(event: { action: string; record: RetroParticipantRecord }): void {
		if (event.action === 'create') {
			if (this.#participants.some((p) => p.id === event.record.id)) return;
			this.#participants = [...this.#participants, event.record];
		} else if (event.action === 'delete') {
			this.#participants = this.#participants.filter((p) => p.id !== event.record.id);
		}
	}
}

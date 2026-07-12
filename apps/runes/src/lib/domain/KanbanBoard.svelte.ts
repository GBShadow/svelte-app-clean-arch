import type {
	KanbanColumnRecord,
	KanbanCardRecord,
	KanbanCardCommentRecord,
	KanbanCardHistoryRecord
} from '$lib/server/kanbanRecord';

export type KanbanSubscribe = (
	onColumnEvent: (event: { action: string; record: KanbanColumnRecord }) => void,
	onCardEvent: (event: { action: string; record: KanbanCardRecord }) => void,
	onCommentEvent: (event: { action: string; record: KanbanCardCommentRecord }) => void,
	onHistoryEvent: (event: { action: string; record: KanbanCardHistoryRecord }) => void
) => () => void;

export class KanbanBoard {
	#columns = $state<KanbanColumnRecord[]>([]);
	#cards = $state<KanbanCardRecord[]>([]);
	#comments = $state<KanbanCardCommentRecord[]>([]);
	#history = $state<KanbanCardHistoryRecord[]>([]);

	#subscribeFn: KanbanSubscribe;
	#unsubscribe: (() => void) | null = null;

	constructor(
		initialColumns: KanbanColumnRecord[],
		initialCards: KanbanCardRecord[],
		initialComments: KanbanCardCommentRecord[],
		initialHistory: KanbanCardHistoryRecord[],
		subscribeFn: KanbanSubscribe
	) {
		this.#columns = initialColumns;
		this.#cards = initialCards;
		this.#comments = initialComments;
		this.#history = initialHistory;
		this.#subscribeFn = subscribeFn;
	}

	get columns(): KanbanColumnRecord[] {
		return [...this.#columns].sort((a, b) => a.position - b.position);
	}

	get cards(): KanbanCardRecord[] {
		return [...this.#cards].sort((a, b) => a.position - b.position);
	}

	get comments(): KanbanCardCommentRecord[] {
		return [...this.#comments].sort(
			(a, b) => new Date(a.created).getTime() - new Date(b.created).getTime()
		);
	}

	get history(): KanbanCardHistoryRecord[] {
		return [...this.#history].sort(
			(a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
		);
	}

	start(): void {
		this.#unsubscribe = this.#subscribeFn(
			(colEvent) => this.#handleColumnEvent(colEvent),
			(cardEvent) => this.#handleCardEvent(cardEvent),
			(commentEvent) => this.#handleCommentEvent(commentEvent),
			(histEvent) => this.#handleHistoryEvent(histEvent)
		);
	}

	stop(): void {
		this.#unsubscribe?.();
		this.#unsubscribe = null;
	}

	sync(
		columns: KanbanColumnRecord[],
		cards: KanbanCardRecord[],
		comments: KanbanCardCommentRecord[],
		history: KanbanCardHistoryRecord[]
	): void {
		this.#columns = columns;
		this.#cards = cards;
		this.#comments = comments;
		this.#history = history;
	}

	#handleColumnEvent(event: { action: string; record: KanbanColumnRecord }): void {
		if (event.action === 'create') {
			if (this.#columns.some((c) => c.id === event.record.id)) return;
			this.#columns = [...this.#columns, event.record];
		} else if (event.action === 'update') {
			this.#columns = this.#columns.map((c) => (c.id === event.record.id ? event.record : c));
		} else if (event.action === 'delete') {
			this.#columns = this.#columns.filter((c) => c.id !== event.record.id);
		}
	}

	#handleCardEvent(event: { action: string; record: KanbanCardRecord }): void {
		if (event.action === 'create') {
			if (this.#cards.some((c) => c.id === event.record.id)) return;
			this.#cards = [...this.#cards, event.record];
		} else if (event.action === 'update') {
			this.#cards = this.#cards.map((c) => (c.id === event.record.id ? event.record : c));
		} else if (event.action === 'delete') {
			this.#cards = this.#cards.filter((c) => c.id !== event.record.id);
		}
	}

	#handleCommentEvent(event: { action: string; record: KanbanCardCommentRecord }): void {
		if (event.action === 'create') {
			if (this.#comments.some((c) => c.id === event.record.id)) return;
			this.#comments = [...this.#comments, event.record];
		} else if (event.action === 'update') {
			this.#comments = this.#comments.map((c) => (c.id === event.record.id ? event.record : c));
		} else if (event.action === 'delete') {
			this.#comments = this.#comments.filter((c) => c.id !== event.record.id);
		}
	}

	#handleHistoryEvent(event: { action: string; record: KanbanCardHistoryRecord }): void {
		if (event.action === 'create') {
			if (this.#history.some((c) => c.id === event.record.id)) return;
			this.#history = [...this.#history, event.record];
		} else if (event.action === 'update') {
			this.#history = this.#history.map((c) => (c.id === event.record.id ? event.record : c));
		} else if (event.action === 'delete') {
			this.#history = this.#history.filter((c) => c.id !== event.record.id);
		}
	}
}

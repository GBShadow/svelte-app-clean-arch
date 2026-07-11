import type { ChatMessageRecord } from '$lib/server/chatRecord';

export type ChatMessageSubscribe = (
	roomId: string,
	onMessage: (message: ChatMessageRecord) => void
) => () => void;

export class ChatMessagesFeed {
	#messages = $state<ChatMessageRecord[]>([]);
	#roomId: string;
	#subscribeFn: ChatMessageSubscribe;
	#unsubscribe: (() => void) | null = null;

	constructor(
		roomId: string,
		initialMessages: ChatMessageRecord[],
		subscribeFn: ChatMessageSubscribe
	) {
		this.#roomId = roomId;
		this.#messages = initialMessages;
		this.#subscribeFn = subscribeFn;
	}

	get messages(): ChatMessageRecord[] {
		return this.#messages;
	}

	start(): void {
		this.#unsubscribe = this.#subscribeFn(this.#roomId, (message) => this.#addMessage(message));
	}

	stop(): void {
		this.#unsubscribe?.();
		this.#unsubscribe = null;
	}

	sync(messages: ChatMessageRecord[]): void {
		this.#messages = messages;
	}

	#addMessage(message: ChatMessageRecord): void {
		if (this.#messages.some((existing) => existing.id === message.id)) return;
		this.#messages = [...this.#messages, message];
	}
}

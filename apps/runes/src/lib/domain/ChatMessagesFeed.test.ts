import { describe, expect, test, vi } from 'vitest';
import { ChatMessagesFeed } from './ChatMessagesFeed.svelte';
import type { ChatMessageRecord } from '$lib/server/chatRecord';

function makeMessage(id: string, text: string): ChatMessageRecord {
	return { id, room: 'room-1', sender: 'user-1', text, created: id, updated: id };
}

describe('ChatMessagesFeed', () => {
	test('inicia com as mensagens carregadas via load', () => {
		const initial = [makeMessage('m1', 'oi')];
		const feed = new ChatMessagesFeed('room-1', initial, () => () => {});
		expect(feed.messages).toEqual(initial);
	});

	test('adiciona mensagem nova vinda da subscription', () => {
		let capturedOnMessage: ((m: ChatMessageRecord) => void) | undefined;
		const subscribe = vi.fn((_roomId: string, onMessage: (m: ChatMessageRecord) => void) => {
			capturedOnMessage = onMessage;
			return () => {};
		});
		const feed = new ChatMessagesFeed('room-1', [], subscribe);
		feed.start();

		capturedOnMessage?.(makeMessage('m2', 'nova mensagem'));

		expect(feed.messages).toHaveLength(1);
		expect(feed.messages[0].text).toBe('nova mensagem');
	});

	test('deduplica mensagem já presente por id', () => {
		let capturedOnMessage: ((m: ChatMessageRecord) => void) | undefined;
		const subscribe = vi.fn((_roomId: string, onMessage: (m: ChatMessageRecord) => void) => {
			capturedOnMessage = onMessage;
			return () => {};
		});
		const initial = [makeMessage('m1', 'oi')];
		const feed = new ChatMessagesFeed('room-1', initial, subscribe);
		feed.start();

		capturedOnMessage?.(makeMessage('m1', 'oi'));

		expect(feed.messages).toHaveLength(1);
	});

	test('stop() chama a função de unsubscribe retornada', () => {
		const unsubscribe = vi.fn();
		const feed = new ChatMessagesFeed('room-1', [], () => unsubscribe);
		feed.start();
		feed.stop();
		expect(unsubscribe).toHaveBeenCalledOnce();
	});

	test('sync() substitui as mensagens (revalidação do load)', () => {
		const feed = new ChatMessagesFeed('room-1', [makeMessage('m1', 'oi')], () => () => {});
		feed.sync([makeMessage('m1', 'oi'), makeMessage('m2', 'tudo bem?')]);
		expect(feed.messages).toHaveLength(2);
	});
});

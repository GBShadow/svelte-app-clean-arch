import { describe, expect, test, vi } from 'vitest';
import { KanbanBoard } from './KanbanBoard.svelte';
import type {
	KanbanColumnRecord,
	KanbanCardRecord,
	KanbanCardCommentRecord,
	KanbanCardHistoryRecord
} from '$lib/server/kanbanRecord';

describe('KanbanBoard', () => {
	const initialCols: KanbanColumnRecord[] = [
		{ id: 'col1', name: 'Aguardando', position: 0, type: 'backlog', project: 'proj1', created: '', updated: '' },
		{ id: 'col3', name: 'Feito', position: 2, type: 'done', project: 'proj1', created: '', updated: '' },
		{ id: 'col2', name: 'Fazendo', position: 1, type: 'custom', project: 'proj1', created: '', updated: '' }
	];

	const initialCards: KanbanCardRecord[] = [
		{
			id: 'card1',
			title: 'Card 1',
			description: '',
			column: 'col1',
			created_by: 'user1',
			assignees: [],
			position: 1,
			points: null,
			tags: null,
			dueDate: null,
			project: 'proj1',
			sprint: null,
			created: '',
			updated: ''
		},
		{
			id: 'card2',
			title: 'Card 2',
			description: '',
			column: 'col1',
			created_by: 'user1',
			assignees: [],
			position: 0,
			points: null,
			tags: null,
			dueDate: null,
			project: 'proj1',
			sprint: null,
			created: '',
			updated: ''
		}
	];

	const mockSubscribe = vi.fn(() => () => {});

	test('ordena colunas por posição', () => {
		const board = new KanbanBoard(initialCols, [], [], [], mockSubscribe);
		expect(board.columns.map((c) => c.id)).toEqual(['col1', 'col2', 'col3']);
	});

	test('ordena cards por posição', () => {
		const board = new KanbanBoard([], initialCards, [], [], mockSubscribe);
		expect(board.cards.map((c) => c.id)).toEqual(['card2', 'card1']);
	});

	test('insere nova coluna em tempo real', () => {
		let colHandler: any;
		const sub = (onCol: any) => {
			colHandler = onCol;
			return () => {};
		};
		const board = new KanbanBoard(initialCols, [], [], [], sub);
		board.start();

		const newCol: KanbanColumnRecord = {
			id: 'col4',
			name: 'Custom',
			position: 3,
			type: 'custom',
			project: 'proj1',
			created: '',
			updated: ''
		};
		colHandler({ action: 'create', record: newCol });

		expect(board.columns.map((c) => c.id)).toContain('col4');
	});

	test('atualiza coluna em tempo real', () => {
		let colHandler: any;
		const sub = (onCol: any) => {
			colHandler = onCol;
			return () => {};
		};
		const board = new KanbanBoard(initialCols, [], [], [], sub);
		board.start();

		const updatedCol: KanbanColumnRecord = {
			id: 'col2',
			name: 'Fazendo Novo',
			position: 1,
			type: 'custom',
			project: 'proj1',
			created: '',
			updated: ''
		};
		colHandler({ action: 'update', record: updatedCol });

		const col2 = board.columns.find((c) => c.id === 'col2');
		expect(col2?.name).toBe('Fazendo Novo');
	});

	test('deleta coluna em tempo real', () => {
		let colHandler: any;
		const sub = (onCol: any) => {
			colHandler = onCol;
			return () => {};
		};
		const board = new KanbanBoard(initialCols, [], [], [], sub);
		board.start();

		colHandler({
			action: 'delete',
			record: { id: 'col2', name: '', position: 1, type: 'custom', project: 'proj1', created: '', updated: '' }
		});

		expect(board.columns.map((c) => c.id)).not.toContain('col2');
	});
});

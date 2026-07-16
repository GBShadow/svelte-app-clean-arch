import { describe, expect, test } from 'vitest';
import { isCreator, isParticipant, nextCreatorAfter } from './chatRoomAccess';

describe('isParticipant', () => {
	test('participante está na lista', () => {
		expect(isParticipant({ createdBy: 'u1', participantIds: ['u1', 'u2'] }, 'u2')).toBe(true);
	});

	test('não-participante não está na lista', () => {
		expect(isParticipant({ createdBy: 'u1', participantIds: ['u1', 'u2'] }, 'u3')).toBe(false);
	});

	test('criador que é participante é reconhecido', () => {
		expect(isParticipant({ createdBy: 'u1', participantIds: ['u1', 'u2'] }, 'u1')).toBe(true);
	});

	test('lista vazia não tem participantes', () => {
		expect(isParticipant({ createdBy: 'u1', participantIds: [] }, 'u1')).toBe(false);
	});
});

describe('isCreator', () => {
	test('criador é reconhecido', () => {
		expect(isCreator({ createdBy: 'u1', participantIds: ['u1', 'u2'] }, 'u1')).toBe(true);
	});

	test('não-criador não é reconhecido', () => {
		expect(isCreator({ createdBy: 'u1', participantIds: ['u1', 'u2'] }, 'u2')).toBe(false);
	});
});

describe('nextCreatorAfter', () => {
	test('transfere para o próximo mais antigo (primeiro do array restante)', () => {
		expect(nextCreatorAfter(['u1', 'u2', 'u3'], 'u1')).toBe('u2');
	});

	test('preserva ordem mesmo removendo do meio', () => {
		expect(nextCreatorAfter(['u1', 'u2', 'u3'], 'u2')).toBe('u1');
	});

	test('retorna null quando não sobra ninguém', () => {
		expect(nextCreatorAfter(['u1'], 'u1')).toBeNull();
	});
});

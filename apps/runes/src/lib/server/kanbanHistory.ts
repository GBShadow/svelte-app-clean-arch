import { getAdminClient } from './pocketbaseAdmin';

/**
 * Cria um registro de histórico para uma alteração de card.
 * Usa o cliente PocketBase Admin pois a regra de criação direta pelo cliente é bloqueada (null).
 */
export async function recordCardHistory(cardId: string, userId: string, field: string): Promise<void> {
	const adminPb = await getAdminClient();
	await adminPb.collection('kanban_card_history').create({
		card: cardId,
		user: userId,
		field: field
	});
}

/**
 * Compara dois estados de um card e registra no histórico os campos que mudaram.
 */
export async function recordCardChanges(
	cardId: string,
	userId: string,
	oldData: Record<string, any>,
	newData: Record<string, any>
): Promise<void> {
	const fieldsToCheck = ['title', 'description', 'column', 'assignees', 'points', 'tags', 'dueDate'];
	for (const field of fieldsToCheck) {
		if (newData[field] === undefined) continue;

		const oldVal = oldData[field];
		const newVal = newData[field];

		let changed = false;
		if (Array.isArray(oldVal) && Array.isArray(newVal)) {
			// Compara arrays (ex: assignees ou tags), ordenando para evitar falso positivo por ordem
			const sortedOld = [...oldVal].sort();
			const sortedNew = [...newVal].sort();
			changed = sortedOld.length !== sortedNew.length || sortedOld.some((v, i) => v !== sortedNew[i]);
		} else {
			// Trata null vs undefined vs empty string
			const normalizedOld = oldVal === undefined || oldVal === null ? '' : String(oldVal);
			const normalizedNew = newVal === undefined || newVal === null ? '' : String(newVal);
			changed = normalizedOld !== normalizedNew;
		}

		if (changed) {
			await recordCardHistory(cardId, userId, field);
		}
	}
}

/**
 * Log mínimo para operações best-effort (disparadas sem `await` no caminho
 * crítico, com `.catch()` para não derrubar a requisição principal).
 *
 * Um `.catch(() => {})` sem log torna falhas sistêmicas (ex.: erro de sintaxe
 * de filtro, autocancelação do client PocketBase, campo obrigatório inválido)
 * indistinguíveis de "não havia nada para notificar" — o bug fica invisível
 * até alguém notar o sintoma indireto (notificação nunca chega) e não há
 * nenhum rastro de causa nos logs do servidor.
 */
export function logError(context: string, err: unknown): void {
	console.error(`[${context}]`, err);
}

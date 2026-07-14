/**
 * Tags e atributos de sanitize-html necessários para o TaskList/TaskItem do Tiptap sobreviverem
 * ao salvar. Por padrão, sanitize-html remove `input`/`label` (o checkbox interativo) e qualquer
 * atributo de `ul`/`li` fora da allowlist, incluindo `data-type`/`data-checked` — degradando a
 * lista de tarefas silenciosamente para uma lista comum, sem checkbox e sem estado de conclusão.
 */
export const TASK_LIST_SANITIZE_TAGS = ['input', 'label'];

export const TASK_LIST_SANITIZE_ATTRIBUTES = {
	ul: ['data-type'],
	li: ['data-type', 'data-checked'],
	input: ['type', 'checked', 'disabled']
};

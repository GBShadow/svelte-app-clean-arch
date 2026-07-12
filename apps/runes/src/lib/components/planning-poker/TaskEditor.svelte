<script lang="ts">
	import RichTextEditor from '$lib/components/kanban/RichTextEditor.svelte';
	import { Plus, X } from 'lucide-svelte';

	let {
		show = $bindable(false),
		errors = {},
		onCreateTask
	} = $props();

	let title = $state('');
	let description = $state('');

	function handleClose() {
		show = false;
		title = '';
		description = '';
	}

	function handleSubmit() {
		if (!title.trim()) return;
		onCreateTask({ title, description });
		handleClose();
	}
</script>

{#if show}
	<div class="modal modal-open bg-black/60 backdrop-blur-xs flex items-center justify-center z-50">
		<div class="modal-box max-w-2xl border border-base-300 bg-base-100 p-6 flex flex-col max-h-[90vh]">
			<div class="flex justify-between items-center mb-6">
				<h3 class="font-bold text-lg text-base-content flex items-center gap-2">
					<Plus class="w-5 h-5 text-primary" />
					Nova Tarefa para Votar
				</h3>
				<button class="btn btn-ghost btn-circle btn-sm" onclick={handleClose}>
					<X class="w-4 h-4" />
				</button>
			</div>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
				class="space-y-4 overflow-y-auto flex-1 pr-1"
			>
				<!-- Título -->
				<div class="form-control w-full">
					<label class="label text-xs font-semibold uppercase tracking-wider text-base-content/60" for="task-title">
						Título da Tarefa
					</label>
					<input
						type="text"
						id="task-title"
						bind:value={title}
						placeholder="Ex: Criar API de Autenticação"
						class="input input-bordered w-full"
						required
						data-testid="input-task-title"
					/>
					{#if errors.title}
						<span class="text-xs text-error mt-1">{errors.title}</span>
					{/if}
				</div>

				<!-- Descrição Rica (Tiptap) -->
				<div class="form-control w-full">
					<label class="label text-xs font-semibold uppercase tracking-wider text-base-content/60" for="task-desc">
						Descrição da Tarefa
					</label>
					<RichTextEditor
						bind:value={description}
						placeholder="Descreva a tarefa em detalhes..."
					/>
					{#if errors.description}
						<span class="text-xs text-error mt-1">{errors.description}</span>
					{/if}
				</div>

				{#if errors.general}
					<div class="alert alert-error text-xs p-3">
						<span>{errors.general}</span>
					</div>
				{/if}

				<!-- Ações -->
				<div class="modal-action flex justify-end gap-2 mt-6 shrink-0">
					<button
						type="button"
						class="btn btn-ghost"
						onclick={handleClose}
					>
						Cancelar
					</button>
					<button
						type="submit"
						class="btn btn-primary"
						disabled={!title.trim()}
						data-testid="btn-save-poker-task"
					>
						Criar Tarefa
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<script lang="ts">
	import { enhance } from '$app/forms';
	import { withToast } from '$lib/client/enhanceWithToast';
	import type { PageProps } from './$types';
	import RichTextEditor from '$lib/components/kanban/RichTextEditor.svelte';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Plus from 'lucide-svelte/icons/plus';
	import Edit2 from 'lucide-svelte/icons/edit-2';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import X from 'lucide-svelte/icons/x';
	import ClipboardList from 'lucide-svelte/icons/clipboard-list';

	let { data, form }: PageProps = $props();

	// Modal controls
	let showModal = $state(false);
	let editingTask = $state<{ id: string; title: string; description: string } | null>(null);

	let title = $state('');
	let description = $state('');

	function openCreate() {
		editingTask = null;
		title = '';
		description = '';
		showModal = true;
	}

	function openEdit(task: any) {
		editingTask = task;
		title = task.title;
		description = task.description || '';
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		editingTask = null;
		title = '';
		description = '';
	}
</script>

<div class="mx-auto w-full max-w-5xl p-4 flex flex-col gap-6">
	<!-- Top Navigation and Title -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-base-200 border border-base-300 p-6 rounded-2xl">
		<div class="flex items-center gap-3">
			<a href="/poker" class="btn btn-ghost btn-sm btn-circle" title="Voltar ao Poker Hub">
				<ArrowLeft class="w-5 h-5" />
			</a>
			<div>
				<h1 class="text-2xl font-black tracking-tight text-base-content/90">Backlog Global</h1>
				<p class="text-xs text-base-content/50 mt-0.5">Gerenciamento centralizado de tarefas para estimativa</p>
			</div>
		</div>

		{#if data.isAdmin}
			<button class="btn btn-primary btn-sm flex items-center gap-1.5" onclick={openCreate} data-testid="btn-new-global-task">
				<Plus class="w-4 h-4" />
				Nova Tarefa Global
			</button>
		{/if}
	</div>

	<!-- Errors if any -->
	{#if form?.errors?.general}
		<div class="alert alert-error" role="alert">
			<span>{form.errors.general}</span>
		</div>
	{/if}

	<!-- Tasks List -->
	{#if data.tasks.length === 0}
		<div class="flex flex-col items-center justify-center py-20 px-4 bg-base-200 border border-dashed border-base-300 rounded-2xl text-center text-base-content/40 text-sm">
			<ClipboardList class="w-12 h-12 text-base-content/20 mb-3" />
			Nenhuma tarefa cadastrada no Backlog Global ainda.
			{#if data.isAdmin}
				<button class="btn btn-primary btn-sm mt-4" onclick={openCreate}>Criar primeira tarefa</button>
			{/if}
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			{#each data.tasks as task (task.id)}
				<div class="card bg-base-100 border border-base-300 shadow-xs hover:shadow-md transition-shadow">
					<div class="card-body p-5 justify-between">
						<div class="space-y-2">
							<h3 class="font-bold text-lg text-base-content/90" data-testid="task-title-{task.id}">{task.title}</h3>
							{#if task.description}
								<div class="text-sm text-base-content/75 prose prose-sm max-w-none">
									<!-- eslint-disable-next-line svelte/no-at-html-tags -->
									{@html task.description}
								</div>
							{/if}
						</div>

						{#if data.isAdmin}
							<div class="card-actions justify-end mt-4 pt-3 border-t border-base-200 gap-2">
								<button class="btn btn-ghost btn-xs flex items-center gap-1" onclick={() => openEdit(task)} data-testid="btn-edit-global-{task.id}">
									<Edit2 class="w-3.5 h-3.5" />
									Editar
								</button>
								<form method="POST" action="?/deleteGlobalTask" use:enhance={withToast({ successMessage: 'Tarefa excluída!' })}>
									<input type="hidden" name="taskId" value={task.id} />
									<button type="submit" class="btn btn-ghost btn-xs text-error flex items-center gap-1" data-testid="btn-delete-global-{task.id}">
										<Trash2 class="w-3.5 h-3.5" />
										Excluir
									</button>
								</form>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Modal for Create / Edit -->
{#if showModal}
	<div class="modal modal-open bg-black/60 backdrop-blur-xs flex items-center justify-center z-50">
		<div class="modal-box max-w-2xl border border-base-300 bg-base-100 p-6 flex flex-col max-h-[90vh]">
			<div class="flex justify-between items-center mb-6">
				<h3 class="font-bold text-lg text-base-content flex items-center gap-2">
					<ClipboardList class="w-5 h-5 text-primary" />
					{editingTask ? 'Editar Tarefa Global' : 'Nova Tarefa Global'}
				</h3>
				<button class="btn btn-ghost btn-circle btn-sm" onclick={closeModal}>
					<X class="w-4 h-4" />
				</button>
			</div>

			<form
				method="POST"
				action={editingTask ? '?/editGlobalTask' : '?/createGlobalTask'}
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						closeModal();
					};
				}}
				class="space-y-4 overflow-y-auto flex-1 pr-1"
			>
				{#if editingTask}
					<input type="hidden" name="taskId" value={editingTask.id} />
				{/if}

				<!-- Title -->
				<div class="form-control w-full">
					<label class="label text-xs font-semibold uppercase tracking-wider text-base-content/60" for="global-task-title">
						Título da Tarefa
					</label>
					<input
						type="text"
						id="global-task-title"
						name="title"
						bind:value={title}
						placeholder="Ex: Refatorar API de Notificações"
						class="input input-bordered w-full"
						required
						data-testid="input-global-task-title"
					/>
					{#if (form?.errors as any)?.title}
						<span class="text-xs text-error mt-1">{(form?.errors as any)?.title}</span>
					{/if}
				</div>

				<!-- Rich Text Editor (Description) -->
				<div class="form-control w-full">
					<label class="label text-xs font-semibold uppercase tracking-wider text-base-content/60" for="global-task-desc">
						Descrição da Tarefa
					</label>
					<input type="hidden" name="description" value={description} />
					<RichTextEditor
						bind:value={description}
						placeholder="Detalhes adicionais sobre a tarefa..."
					/>
					{#if (form?.errors as any)?.description}
						<span class="text-xs text-error mt-1">{(form?.errors as any)?.description}</span>
					{/if}
				</div>

				<!-- Actions -->
				<div class="modal-action flex justify-end gap-2 mt-6 shrink-0">
					<button type="button" class="btn btn-ghost" onclick={closeModal}>
						Cancelar
					</button>
					<button type="submit" class="btn btn-primary" disabled={!title.trim()} data-testid="btn-save-global-task">
						{editingTask ? 'Salvar Alterações' : 'Criar Tarefa'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

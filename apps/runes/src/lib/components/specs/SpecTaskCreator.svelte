<script lang="ts">
	import { enhance } from '$app/forms';
	import MarkdownEditor from '$lib/components/editor/MarkdownEditor.svelte';

	let {
		documentId: _documentId,
		projectId: _projectId
	}: {
		documentId: string;
		projectId: string;
	} = $props();

	let taskMessage = $state('');
	let created = $state(false);
	let description = $state('');
</script>

<div class="card bg-base-200 p-3">
	{#if created}
		<p class="text-sm text-success">{taskMessage}</p>
		<button
			class="btn btn-outline btn-xs mt-2"
			onclick={() => {
				created = false;
				taskMessage = '';
			}}
		>
			Criar outra task
		</button>
	{:else}
		<form
			method="POST"
			action="?/createTask"
			class="flex flex-col gap-2"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						created = true;
						taskMessage = 'Task criada no backlog global!';
						await update();
					} else {
						taskMessage = 'Erro ao criar task.';
					}
				};
			}}
		>
			<input
				type="text"
				name="title"
				class="input input-bordered input-sm"
				placeholder="Título da task"
				required
			/>
			<input type="hidden" name="description" value={description} />
			<MarkdownEditor bind:value={description} dataTestid="spec-task-desc-editor" />
			<div class="flex gap-1">
				<button class="btn btn-primary btn-xs" type="submit">Criar task</button>
			</div>
			{#if taskMessage}
				<p class="text-xs text-error">{taskMessage}</p>
			{/if}
		</form>
	{/if}
</div>

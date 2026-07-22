<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';

	let { data, form }: PageProps = $props();

	const project = $derived(data.project as any);

	let title = $state(project.title);
	let description = $state(project.description);
</script>

<div class="mx-auto w-full max-w-2xl p-4">
	<a href="/projects/{project.id}" class="btn btn-ghost btn-sm gap-2 mb-6">
		<ArrowLeft class="w-4 h-4" />
		Voltar
	</a>

	<div class="bg-base-200 border border-base-300 rounded-2xl p-6">
		<h1 class="text-2xl font-bold mb-6">Editar Projeto</h1>

		<form method="POST" use:enhance class="flex flex-col gap-4">
			<div class="form-control">
				<label class="label font-medium text-sm" for="title">Título *</label>
				<input
					id="title"
					type="text"
					name="title"
					required
					class="input input-bordered w-full"
					bind:value={title}
				/>
				{#if (form?.errors as any)?.title}
					<span class="text-xs text-error mt-1">{(form?.errors as any)?.title}</span>
				{/if}
			</div>

			<div class="form-control">
				<label class="label font-medium text-sm" for="description">Descrição *</label>
				<textarea
					id="description"
					name="description"
					required
					class="textarea textarea-bordered w-full h-32"
					bind:value={description}
				></textarea>
				{#if (form?.errors as any)?.description}
					<span class="text-xs text-error mt-1">{(form?.errors as any)?.description}</span>
				{/if}
			</div>

			{#if (form?.errors as any)?.general}
				<div class="alert alert-error text-sm p-3">
					<span>{(form?.errors as any)?.general}</span>
				</div>
			{/if}

			<div class="flex gap-2 justify-end mt-4">
				<a href="/projects/{project.id}" class="btn btn-ghost">Cancelar</a>
				<button type="submit" class="btn btn-primary" data-testid="btn-save-project">Salvar</button>
			</div>
		</form>
	</div>
</div>

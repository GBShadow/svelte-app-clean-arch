<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Shield from 'lucide-svelte/icons/shield';

	let { data, form }: PageProps = $props();

	let title = $state('');
	let description = $state('');
	let selectedResponsaveis = $state<string[]>([]);
	let selectedParticipants = $state<string[]>([]);

	let availableUsers = $derived(data.users.filter((u) => u.id !== data.userId));

	function toggleUser(arr: string[], id: string): string[] {
		return arr.includes(id) ? arr.filter((v) => v !== id) : [...arr, id];
	}
</script>

<div class="mx-auto w-full max-w-2xl p-4">
	<a href="/projects" class="btn btn-ghost btn-sm gap-2 mb-6">
		<ArrowLeft class="w-4 h-4" />
		Voltar
	</a>

	<div class="bg-base-200 border border-base-300 rounded-2xl p-6">
		<h1 class="text-2xl font-bold mb-6">Novo Projeto</h1>

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
					placeholder="Nome do projeto"
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
					placeholder="Descrição do projeto"
				></textarea>
				{#if (form?.errors as any)?.description}
					<span class="text-xs text-error mt-1">{(form?.errors as any)?.description}</span>
				{/if}
			</div>

			{#if availableUsers.length > 0}
				<fieldset class="form-control">
					<legend class="label font-medium text-sm flex items-center gap-1.5">
						<Shield class="w-4 h-4" />
						Responsáveis
					</legend>
					<div class="flex flex-col gap-1.5 max-h-40 overflow-y-auto border border-base-300 rounded-lg p-2">
						{#each availableUsers as user (user.id)}
							<label class="flex items-center gap-2 cursor-pointer py-1 px-1.5 hover:bg-base-200 rounded">
								<input
									type="checkbox"
									name="responsaveisIds[]"
									value={user.id}
									checked={selectedResponsaveis.includes(user.id)}
									onchange={() => (selectedResponsaveis = toggleUser(selectedResponsaveis, user.id))}
									class="checkbox checkbox-sm checkbox-primary"
								/>
								<div class="avatar placeholder">
									<div class="bg-neutral text-neutral-content w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono">
										{user.name?.charAt(0)?.toUpperCase() || '?'}
									</div>
								</div>
								<span class="text-sm">{user.name}</span>
								<span class="text-xs text-base-content/50 ml-auto">{user.email}</span>
							</label>
						{/each}
					</div>
				</fieldset>

				<fieldset class="form-control">
					<legend class="label font-medium text-sm">Participantes</legend>
					<div class="flex flex-col gap-1.5 max-h-40 overflow-y-auto border border-base-300 rounded-lg p-2">
						{#each availableUsers as user (user.id)}
							<label class="flex items-center gap-2 cursor-pointer py-1 px-1.5 hover:bg-base-200 rounded">
								<input
									type="checkbox"
									name="participantIds[]"
									value={user.id}
									checked={selectedParticipants.includes(user.id)}
									onchange={() => (selectedParticipants = toggleUser(selectedParticipants, user.id))}
									class="checkbox checkbox-sm checkbox-primary"
								/>
								<div class="avatar placeholder">
									<div class="bg-neutral text-neutral-content w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono">
										{user.name?.charAt(0)?.toUpperCase() || '?'}
									</div>
								</div>
								<span class="text-sm">{user.name}</span>
								<span class="text-xs text-base-content/50 ml-auto">{user.email}</span>
							</label>
						{/each}
					</div>
				</fieldset>
			{/if}

			{#if (form?.errors as any)?.general}
				<div class="alert alert-error text-sm p-3">
					<span>{(form?.errors as any)?.general}</span>
				</div>
			{/if}

			<div class="flex gap-2 justify-end mt-4">
				<a href="/projects" class="btn btn-ghost">Cancelar</a>
				<button type="submit" class="btn btn-primary" data-testid="btn-save-project">Criar Projeto</button>
			</div>
		</form>
	</div>
</div>

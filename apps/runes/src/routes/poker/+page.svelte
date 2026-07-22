<script lang="ts">
	import type { ActionData, PageProps } from './$types';
	import { enhance } from '$app/forms';
	import Plus from 'lucide-svelte/icons/plus';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Dices from 'lucide-svelte/icons/dices';
	import User from 'lucide-svelte/icons/user';
	import FolderKanban from 'lucide-svelte/icons/folder-kanban';
	import type { ProjectRecord } from '$lib/server/projectRecord';

	let { data, form }: PageProps = $props();

	const projects = $derived(data.projects as ProjectRecord[]);

	let showModal = $state(false);
	let name = $state('');
	let selectedProjectId = $state('');

	function openModal() {
		showModal = true;
		name = '';
		selectedProjectId = projects[0]?.id || '';
	}

	function closeModal() {
		showModal = false;
	}
</script>

<div class="mx-auto w-full max-w-4xl p-4">
	<div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
		<div>
			<h1 class="text-3xl font-black tracking-tight text-primary flex items-center gap-3">
				<Dices class="w-8 h-8" />
				Planning Poker
			</h1>
			<p class="text-base-content/60 text-sm mt-1">
				Estime o esforço de tarefas colaborativamente e em tempo real com seu time
			</p>
		</div>
		<div class="flex items-center gap-2">
			<a href="/poker/backlog" class="btn btn-outline" data-testid="btn-go-backlog">
				Backlog Global
			</a>
			<button class="btn btn-primary" onclick={openModal} data-testid="btn-open-create-room">
				<Plus class="w-4 h-4 mr-2" />
				Nova Sala
			</button>
		</div>
	</div>

	<!-- Room List -->
	{#if data.rooms.length === 0}
		<div class="flex flex-col items-center justify-center py-16 px-4 bg-base-200 border border-base-300 rounded-2xl text-center">
			<Dices class="w-16 h-16 text-base-content/20 mb-4" />
			<h2 class="text-lg font-bold text-base-content/80">Nenhuma sala ativa</h2>
			<p class="text-sm text-base-content/50 max-w-sm mt-1">
				Você não está participando de nenhuma sala de votação no momento. Crie uma nova sala para começar!
			</p>
			<button class="btn btn-primary btn-sm mt-6" onclick={openModal}>
				Criar primeira sala
			</button>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			{#each data.rooms as room}
				<div class="card bg-base-200 border border-base-300 hover:border-primary/50 transition-colors">
					<div class="card-body p-6 flex flex-col justify-between h-full">
						<div>
							<h3 class="card-title text-lg font-bold text-base-content/90 tracking-tight mb-2">
								{room.name}
							</h3>
							<div class="flex items-center gap-3 text-xs text-base-content/50 mb-4">
								<span class="flex items-center gap-1">
									<User class="w-3.5 h-3.5" />
									{room.expand?.created_by?.name || 'Admin'}
								</span>
								{#if room.expand?.project}
									<span class="flex items-center gap-1">
										<FolderKanban class="w-3.5 h-3.5" />
										{(room.expand?.project as any)?.title}
									</span>
								{/if}
							</div>
						</div>
						<div class="card-actions justify-end">
							<a href="/poker/{room.id}" class="btn btn-primary btn-sm btn-outline group" data-testid="btn-enter-room-{room.id}">
								Entrar na sala
								<ArrowRight class="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-1" />
							</a>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Create Room Modal -->
{#if showModal}
	<div class="modal modal-open bg-black/60 backdrop-blur-xs flex items-center justify-center z-50">
		<div class="modal-box max-w-md border border-base-300 bg-base-100">
			<h3 class="font-bold text-lg text-base-content mb-4">Nova Sala de Planning Poker</h3>

			<form method="POST" action="?/createRoom" use:enhance class="space-y-4">
				<div class="form-control w-full">
					<label class="label text-xs font-semibold uppercase tracking-wider text-base-content/60" for="room-name">
						Nome da sala
					</label>
					<input type="text" id="room-name" name="name" bind:value={name}
						placeholder="Ex: Planning Sprint 2" class="input input-bordered w-full" required
						data-testid="input-room-name" />
					{#if (form?.errors as any)?.name}
						<span class="text-xs text-error mt-1">{(form?.errors as any)?.name}</span>
					{/if}
				</div>

				<!-- Project Selector -->
				<div class="form-control w-full">
					<label class="label text-xs font-semibold uppercase tracking-wider text-base-content/60" for="room-project">
						Projeto *
					</label>
					<select id="room-project" name="projectId" class="select select-bordered w-full"
						bind:value={selectedProjectId} required data-testid="input-room-project">
						<option value="">Selecione um projeto...</option>
						{#each projects as p}
							<option value={p.id}>{p.title}</option>
						{/each}
					</select>
					{#if (form?.errors as any)?.projectId}
						<span class="text-xs text-error mt-1">{(form?.errors as any)?.projectId}</span>
					{/if}
				</div>

				{#if data.globalTasks && data.globalTasks.length > 0}
					<div class="form-control w-full mt-4">
						<label class="label text-xs font-semibold uppercase tracking-wider text-base-content/60">
							Vincular tarefas do Backlog Global (Opcional)
						</label>
						<div class="max-h-40 overflow-y-auto space-y-2 border border-base-300 rounded-lg p-3 bg-base-200">
							{#each data.globalTasks as task}
								<label class="flex items-start gap-2.5 cursor-pointer hover:bg-base-300 p-1 rounded-sm">
									<input type="checkbox" name="taskIds" value={task.id} class="checkbox checkbox-xs mt-0.5 checkbox-primary" />
									<span class="text-xs font-semibold text-base-content/90">{task.title}</span>
								</label>
							{/each}
						</div>
					</div>
				{/if}

				{#if (form?.errors as any)?.general}
					<div class="alert alert-error text-xs p-3">
						<span>{(form?.errors as any)?.general}</span>
					</div>
				{/if}

				<div class="modal-action flex justify-end gap-2 mt-6">
					<button type="button" class="btn btn-ghost" onclick={closeModal}>Cancelar</button>
					<button type="submit" class="btn btn-primary" data-testid="btn-submit-create-room">Criar Sala</button>
				</div>
			</form>
		</div>
	</div>
{/if}

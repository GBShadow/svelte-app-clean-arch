<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import { canManageProject } from '$lib/domain/projectAccess';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Settings from 'lucide-svelte/icons/settings';
	import Trash from 'lucide-svelte/icons/trash';
	import Plus from 'lucide-svelte/icons/plus';
	import Play from 'lucide-svelte/icons/play';
	import Check from 'lucide-svelte/icons/check';
	import User from 'lucide-svelte/icons/user';
	import Shield from 'lucide-svelte/icons/shield';
	import X from 'lucide-svelte/icons/x';
	import FolderKanban from 'lucide-svelte/icons/folder-kanban';
	import type { ProjectRecord, SprintRecord } from '$lib/server/projectRecord';
	import type { UserRecord } from '$lib/server/userRecord';

	let { data, form }: PageProps = $props();

	const project = $derived(data.project as ProjectRecord);
	const sprints = $derived(data.sprints as SprintRecord[]);
	const users = $derived(data.users as UserRecord[]);
	const canManage = $derived(data.canManage as boolean);
	const user = $derived(data.user as any);

	// Sprint form state
	let sprintTitle = $state('');
	let sprintStartDate = $state('');
	let sprintEndDate = $state('');
	let showSprintForm = $state(false);

	// Participant form state
	let selectedUserId = $state('');
	let selectedRole = $state('participant');

	function resetSprintForm() {
		sprintTitle = '';
		sprintStartDate = '';
		sprintEndDate = '';
		showSprintForm = false;
	}

	const activeSprint = $derived(sprints.find((s) => s.status === 'active'));
	const plannedSprints = $derived(sprints.filter((s) => s.status === 'planned'));
	const finishedSprints = $derived(sprints.filter((s) => s.status === 'finished'));

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('pt-BR');
	}

	function isCurrentlyActive(sprint: SprintRecord): boolean {
		if (sprint.status !== 'active') return false;
		const start = new Date(sprint.startDate);
		const end = new Date(sprint.endDate);
		const now = new Date();
		return now >= start && now <= end;
	}
</script>

<div class="mx-auto w-full max-w-4xl p-4">
	<a href="/projects" class="btn btn-ghost btn-sm gap-2 mb-6">
		<ArrowLeft class="w-4 h-4" />
		Voltar
	</a>

	<!-- Project Header -->
	<div class="bg-base-200 border border-base-300 rounded-2xl p-6 mb-6">
		<div class="flex items-start justify-between gap-4">
			<div class="flex items-start gap-4">
				{#if project.image}
					<div class="avatar">
						<div class="w-16 h-16 rounded-xl">
							<img src="/api/files/projects/{project.id}/{project.image}" alt={project.title} class="object-cover" />
						</div>
					</div>
				{:else}
					<div class="w-16 h-16 rounded-xl bg-base-300 flex items-center justify-center">
						<FolderKanban class="w-8 h-8 opacity-50" />
					</div>
				{/if}
				<div>
					<h1 class="text-2xl font-bold">{project.title}</h1>
					<p class="text-sm text-base-content/70 mt-2 whitespace-pre-wrap">{project.description}</p>
					<div class="flex items-center gap-4 mt-3 text-xs text-base-content/50">
						<span>
							Criado por {project.expand?.created_by?.name || 'Desconhecido'}
						</span>
						<span>
							{project.expand?.participants?.length || 0} participantes
						</span>
					</div>
				</div>
			</div>
			<div class="flex items-center gap-2">
				{#if canManage}
					<a href="/projects/{project.id}/edit" class="btn btn-outline btn-sm gap-1">
						<Settings class="w-4 h-4" />
						Editar
					</a>
				{/if}
			</div>
		</div>
	</div>

	<!-- Quick Actions -->
	<div class="flex items-center gap-3 mb-6 flex-wrap">
		<a href="/kanban?project={project.id}" class="btn btn-primary btn-sm gap-1">
			<FolderKanban class="w-4 h-4" />
			Ver Kanban
		</a>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Sprints Section -->
		<div class="bg-base-200 border border-base-300 rounded-2xl p-6">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-bold">Sprints</h2>
				{#if canManage}
					<button
						class="btn btn-ghost btn-sm gap-1"
						onclick={() => (showSprintForm = !showSprintForm)}
					>
						<Plus class="w-4 h-4" />
						Nova Sprint
					</button>
				{/if}
			</div>

			<!-- Create Sprint Form -->
			{#if showSprintForm}
				<form
					method="POST"
					action="?/createSprint"
					use:enhance={() => {
						return async ({ update }) => {
							resetSprintForm();
							await update();
						};
					}}
					class="bg-base-100 border border-base-300 rounded-xl p-4 mb-4 flex flex-col gap-3"
				>
					<div class="form-control">
						<label class="label text-xs font-semibold" for="sprint-title">Título</label>
						<input
							id="sprint-title"
							type="text"
							name="title"
							required
							class="input input-bordered input-sm"
							bind:value={sprintTitle}
							placeholder="Ex: Sprint 2"
						/>
					</div>
					<div class="grid grid-cols-2 gap-3">
						<div class="form-control">
							<label class="label text-xs font-semibold" for="sprint-start">Início</label>
							<input
								id="sprint-start"
								type="date"
								name="startDate"
								required
								class="input input-bordered input-sm"
								bind:value={sprintStartDate}
							/>
						</div>
						<div class="form-control">
							<label class="label text-xs font-semibold" for="sprint-end">Fim</label>
							<input
								id="sprint-end"
								type="date"
								name="endDate"
								required
								class="input input-bordered input-sm"
								bind:value={sprintEndDate}
							/>
						</div>
					</div>
					<div class="flex gap-2 justify-end">
						<button type="button" class="btn btn-ghost btn-xs" onclick={resetSprintForm}>Cancelar</button>
						<button type="submit" class="btn btn-primary btn-xs">Criar</button>
					</div>
				</form>
			{/if}

			<!-- Active Sprint -->
			{#if activeSprint}
				<div class="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
					<div class="flex items-center justify-between mb-2">
						<h3 class="font-bold text-sm text-primary flex items-center gap-2">
							<Play class="w-4 h-4" />
							{activeSprint.title}
							<span class="badge badge-sm badge-primary">Ativa</span>
						</h3>
						{#if canManage}
							<form method="POST" action="?/finalizeSprint" use:enhance>
								<input type="hidden" name="sprintId" value={activeSprint.id} />
								<button type="submit" class="btn btn-ghost btn-xs text-warning gap-1">
									<Check class="w-3 h-3" />
									Finalizar
								</button>
							</form>
						{/if}
					</div>
					<p class="text-xs text-base-content/60">
						{formatDate(activeSprint.startDate)} — {formatDate(activeSprint.endDate)}
					</p>
				</div>
			{/if}

			<!-- Planned Sprints -->
			{#each plannedSprints as sprint}
				<div class="bg-base-100 border border-base-300 rounded-xl p-4 mb-3">
					<div class="flex items-center justify-between">
						<div>
							<h3 class="font-semibold text-sm">{sprint.title}</h3>
							<p class="text-xs text-base-content/60 mt-1">
								{formatDate(sprint.startDate)} — {formatDate(sprint.endDate)}
							</p>
						</div>
						<div class="flex items-center gap-2">
							<span class="badge badge-sm badge-ghost">Planejada</span>
							{#if canManage}
								<form method="POST" action="?/startSprint" use:enhance>
									<input type="hidden" name="sprintId" value={sprint.id} />
									<button type="submit" class="btn btn-ghost btn-xs text-primary gap-1">
										<Play class="w-3 h-3" />
										Iniciar
									</button>
								</form>
							{/if}
						</div>
					</div>
				</div>
			{/each}

			<!-- Finished Sprints -->
			{#if finishedSprints.length > 0}
				<details class="mt-2">
					<summary class="text-xs text-base-content/50 cursor-pointer hover:text-base-content/70">
						Sprints finalizadas ({finishedSprints.length})
					</summary>
					<div class="mt-2 flex flex-col gap-2">
						{#each finishedSprints as sprint}
							<div class="bg-base-100/50 border border-base-300 rounded-lg p-3">
								<div class="flex items-center justify-between">
									<div>
										<h3 class="text-sm font-medium opacity-60">{sprint.title}</h3>
										<p class="text-xs text-base-content/40">
											{formatDate(sprint.startDate)} — {formatDate(sprint.endDate)}
										</p>
									</div>
									<span class="badge badge-sm badge-neutral opacity-60">Finalizada</span>
								</div>
							</div>
						{/each}
					</div>
				</details>
			{/if}

			{#if sprints.length === 0}
				<p class="text-sm text-base-content/50 text-center py-8">Nenhuma sprint criada ainda.</p>
			{/if}
		</div>

		<!-- Participants Section -->
		<div class="bg-base-200 border border-base-300 rounded-2xl p-6">
			<h2 class="text-lg font-bold mb-4">Participantes</h2>

			{#if canManage}
				<form
					method="POST"
					action="?/addParticipant"
					use:enhance
					class="flex items-end gap-2 mb-6 p-3 bg-base-100 border border-base-300 rounded-xl"
				>
					<div class="form-control flex-1">
						<label class="label text-xs font-semibold" for="add-user">Usuário</label>
						<select
							id="add-user"
							name="userId"
							class="select select-bordered select-sm"
							bind:value={selectedUserId}
							required
						>
							<option value="">Selecione...</option>
							{#each users.filter((u) => !project.participants?.includes(u.id)) as u}
								<option value={u.id}>{u.name} ({u.email})</option>
							{/each}
						</select>
					</div>
					<div class="form-control">
						<label class="label text-xs font-semibold" for="add-role">Função</label>
						<select
							id="add-role"
							name="role"
							class="select select-bordered select-sm"
							bind:value={selectedRole}
						>
							<option value="participant">Participante</option>
							<option value="responsavel">Responsável</option>
						</select>
					</div>
					<button type="submit" class="btn btn-primary btn-sm">Adicionar</button>
				</form>
			{/if}

			<div class="flex flex-col gap-2">
				{#if project.expand?.participants}
					{#each project.expand.participants as p}
						<div class="flex items-center justify-between bg-base-100 border border-base-300 rounded-xl p-3">
							<div class="flex items-center gap-3">
								<div class="avatar placeholder">
									<div class="bg-neutral text-neutral-content w-8 h-8 rounded-full flex items-center justify-center text-xs">
										{p.name?.charAt(0) || '?'}
									</div>
								</div>
								<div>
									<span class="text-sm font-medium">{p.name}</span>
									{#if project.expand?.responsaveis?.some((r) => r.id === p.id)}
										<span class="badge badge-xs badge-primary ml-2 gap-1">
											<Shield class="w-3 h-3" />
											Responsável
										</span>
									{/if}
								</div>
							</div>
							{#if canManage && p.id !== user?.id}
								<form method="POST" action="?/removeParticipant" use:enhance>
									<input type="hidden" name="userId" value={p.id} />
									<button type="submit" class="btn btn-ghost btn-xs text-error">
										<X class="w-4 h-4" />
									</button>
								</form>
							{/if}
						</div>
					{/each}
				{/if}
			</div>

			{#if !project.expand?.participants?.length}
				<p class="text-sm text-base-content/50 text-center py-8">Nenhum participante.</p>
			{/if}
		</div>
	</div>
</div>

<script lang="ts">
	import List from 'lucide-svelte/icons/list';
	import Play from 'lucide-svelte/icons/play';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import Send from 'lucide-svelte/icons/send';
	import ClipboardList from 'lucide-svelte/icons/clipboard-list';
	import Plus from 'lucide-svelte/icons/plus';
	import type { PokerTaskRecord } from '$lib/server/pokerRecord';

	let {
		tasks = [],
		currentTaskId = '',
		isAdmin = false,
		roomStatus = 'open',
		onSelectTask,
		onSetPoints,
		onExport,
		onRemoveFromVoting,
		onEditTask,
		onCreateTask
	} = $props();

	let filterStatus = $state<'all' | 'backlog' | 'voting' | 'estimated' | 'exported'>('all');
	let selectedTaskIds = $state<string[]>([]);
	let editingPointsTaskId = $state<string | null>(null);
	let tempPoints = $state<string>('');

	// Filtra as tasks no client-side de forma reativa
	let filteredTasks = $derived(
		tasks.filter((t) => {
			if (filterStatus === 'all') return true;
			return t.status === filterStatus;
		})
	);

	// Tasks estimadas prontas para exportar
	let exportableTasks = $derived(
		tasks.filter((t) => t.status === 'estimated')
	);

	function toggleSelectTask(id: string) {
		if (selectedTaskIds.includes(id)) {
			selectedTaskIds = selectedTaskIds.filter((item) => item !== id);
		} else {
			selectedTaskIds.push(id);
		}
	}

	function startEditPoints(t: PokerTaskRecord) {
		editingPointsTaskId = t.id;
		tempPoints = t.final_points !== null ? String(t.final_points) : '';
	}

	function savePoints(id: string) {
		const val = tempPoints === '' ? null : Number(tempPoints);
		onSetPoints(id, val);
		editingPointsTaskId = null;
	}

	function triggerExport() {
		if (selectedTaskIds.length === 0) return;
		onExport(selectedTaskIds);
		selectedTaskIds = [];
	}
</script>

<div class="bg-base-200 border border-base-300 rounded-2xl p-6">
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
		<h3 class="text-sm font-semibold uppercase tracking-wider text-base-content/60 flex items-center gap-2">
			<List class="w-4 h-4 text-primary" />
			Backlog da Sala ({tasks.length})
		</h3>

		<div class="flex flex-wrap items-center gap-2">
			{#if isAdmin && roomStatus === 'open' && onCreateTask}
				<button
					class="btn btn-ghost btn-xs flex items-center gap-1 text-primary"
					onclick={onCreateTask}
					data-testid="btn-open-create-task"
				>
					<Plus class="w-3.5 h-3.5" />
					Nova Task
				</button>
			{/if}

			<!-- Filtro de Status -->
			<div class="flex flex-wrap gap-1 bg-base-100 border border-base-300 p-0.5 rounded-xl">
				{#each ['all', 'backlog', 'voting', 'estimated', 'exported'] as status}
					<button
						class="btn btn-xs capitalize font-semibold px-2.5
							{filterStatus === status ? 'btn-primary' : 'btn-ghost text-base-content/60'}"
						onclick={() => (filterStatus = status as any)}
					>
						{status === 'all' ? 'todas' : status === 'voting' ? 'votando' : status === 'estimated' ? 'estimadas' : status}
					</button>
				{/each}
			</div>
		</div>
	</div>

	<!-- Lista de Tasks -->
	{#if filteredTasks.length === 0}
		<div class="text-center py-10 border border-dashed border-base-300 rounded-xl text-sm text-base-content/40 bg-base-100">
			Nenhuma tarefa encontrada neste filtro.
		</div>
	{:else}
		<div class="space-y-3 max-h-[400px] overflow-y-auto pr-1">
			{#each filteredTasks as task}
				<div
					class="p-4 bg-base-100 border rounded-xl flex flex-col gap-3 transition-colors
						{task.status === 'voting' ? 'border-primary shadow-sm bg-primary/5' : 'border-base-300'}"
				>
					<div class="flex items-start justify-between gap-4">
						<div class="flex items-center gap-3">
							<!-- Seleção para exportar (Apenas se admin e estimada) -->
							{#if isAdmin && task.status === 'estimated'}
								<input
									type="checkbox"
									class="checkbox checkbox-primary checkbox-xs"
									checked={selectedTaskIds.includes(task.id)}
									onchange={() => toggleSelectTask(task.id)}
									aria-label="Selecionar {task.title} para exportar"
								/>
							{/if}

							<div>
								<h4 class="font-bold text-sm text-base-content/90">{task.title}</h4>
								{#if task.description}
									<div class="text-xs text-base-content/50 mt-1 max-w-lg prose prose-xs prose-neutral">
										<!-- eslint-disable-next-line svelte/no-at-html-tags -->
										{@html task.description}
									</div>
								{/if}
							</div>
						</div>

						<div class="flex items-center gap-2 shrink-0">
							<!-- Badges de status -->
							{#if task.status === 'voting'}
								<span class="badge badge-primary badge-sm font-semibold animate-pulse">Em Votação</span>
							{:else if task.status === 'estimated'}
								<span class="badge badge-success badge-sm font-semibold">
									{task.final_points} SP
								</span>
							{:else if task.status === 'exported'}
								<span class="badge badge-info badge-sm font-semibold flex items-center gap-1">
									No Kanban
								</span>
							{:else}
								<span class="badge badge-neutral badge-sm font-semibold">Backlog</span>
							{/if}

							<!-- Ações -->
							{#if isAdmin}
								{#if task.status === 'backlog' && roomStatus === 'open'}
									<button
										class="btn btn-ghost btn-xs btn-circle text-primary"
										onclick={() => onSelectTask(task.id)}
										title="Iniciar votação desta task"
										data-testid="btn-vote-task-{task.id}"
									>
										<Play class="w-3.5 h-3.5" />
									</button>
								{/if}

								{#if task.status === 'voting' && roomStatus === 'open'}
									<button
										class="btn btn-ghost btn-xs text-error font-semibold"
										onclick={() => onRemoveFromVoting(task.id)}
										title="Remover da votação"
										data-testid="btn-remove-voting-{task.id}"
									>
										Remover Votação
									</button>
								{/if}

								{#if (task.status === 'backlog' || task.status === 'voting') && roomStatus === 'open'}
									<button
										class="btn btn-ghost btn-xs text-base-content/50 hover:text-base-content"
										onclick={() => onEditTask(task)}
										title="Editar título/descrição"
										data-testid="btn-edit-task-{task.id}"
									>
										Editar
									</button>
								{/if}

								<!-- Atribuição de Pontos Finais -->
								{#if task.status !== 'exported'}
									{#if editingPointsTaskId === task.id}
										<div class="flex items-center gap-1 bg-base-200 p-1 rounded-lg">
											<input
												type="number"
												min="0"
												max="999"
												bind:value={tempPoints}
												class="input input-xs input-bordered w-14 font-bold text-center"
												placeholder="SP"
											/>
											<button
												class="btn btn-success btn-xs btn-circle"
												onclick={() => savePoints(task.id)}
												title="Salvar pontos"
											>
												✓
											</button>
										</div>
									{:else}
										<button
											class="btn btn-ghost btn-xs text-base-content/50 hover:text-base-content"
											onclick={() => startEditPoints(task)}
											title="Definir estimativa final"
										>
											{task.status === 'estimated' ? 'Editar' : 'Pontuar'}
										</button>
									{/if}
								{/if}
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Painel de Exportação para o Kanban (Admin) -->
	{#if isAdmin && exportableTasks.length > 0}
		<div class="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4">
			<div class="text-xs text-primary-content/80 text-center sm:text-left">
				<span class="font-bold text-primary block text-sm mb-0.5">Exportar para o Kanban</span>
				Selecione as tasks estimadas e envie direto para a coluna "Aguardando" (Backlog).
			</div>
			<button
				class="btn btn-primary btn-sm flex items-center gap-1.5"
				onclick={triggerExport}
				disabled={selectedTaskIds.length === 0}
				data-testid="btn-export-poker-tasks"
			>
				<ClipboardList class="w-4 h-4" />
				Exportar Selecionadas ({selectedTaskIds.length})
			</button>
		</div>
	{/if}
</div>

<script lang="ts">
	import PageShell from '$lib/components/PageShell.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Tag from 'lucide-svelte/icons/tag';
	import ListChecks from 'lucide-svelte/icons/list-checks';
	import Kanban from 'lucide-svelte/icons/kanban';
	import Dices from 'lucide-svelte/icons/dices';
	import FileText from 'lucide-svelte/icons/file-text';
	import MessageSquareQuote from 'lucide-svelte/icons/message-square-quote';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import CheckCircle2 from 'lucide-svelte/icons/check-circle-2';
	import Circle from 'lucide-svelte/icons/circle';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let category = $derived(data.category);
	let todos = $derived(data.todos || []);
	let kanbanCards = $derived(data.kanbanCards || []);
	let pokerTasks = $derived(data.pokerTasks || []);
	let specDocs = $derived(data.specDocs || []);
	let retroCards = $derived(data.retroCards || []);

	let activeTab = $state<'all' | 'todos' | 'kanban' | 'poker' | 'specs' | 'retro'>('all');

	let totalItems = $derived(
		todos.length + kanbanCards.length + pokerTasks.length + specDocs.length + retroCards.length
	);
</script>

<PageShell width="xl" testId="category-detail-page">
	<div class="mb-4">
		<a
			href="/categories"
			class="btn btn-ghost btn-sm gap-1.5 text-base-content/70 hover:text-base-content"
			data-testid="btn-back-categories"
		>
			<ArrowLeft class="size-4" />
			Voltar para Categorias
		</a>
	</div>

	<PageHeader
		title={category.name}
		description={category.description || 'Categoria global do sistema'}
	>
		<div class="badge badge-primary badge-lg gap-2" data-testid="category-badge-header">
			<Tag class="size-4" />
			{totalItems} item(s) associado(s)
		</div>
	</PageHeader>

	<!-- Tabs de Filtro de Módulo -->
	<div class="tabs tabs-boxed bg-base-200 p-1 mb-6 flex-wrap" data-testid="category-tabs">
		<button
			type="button"
			class="tab text-xs sm:text-sm font-medium {activeTab === 'all' ? 'tab-active' : ''}"
			onclick={() => (activeTab = 'all')}
			data-testid="tab-all"
		>
			Todos ({totalItems})
		</button>
		<button
			type="button"
			class="tab text-xs sm:text-sm font-medium {activeTab === 'todos' ? 'tab-active' : ''}"
			onclick={() => (activeTab = 'todos')}
			data-testid="tab-todos"
		>
			<ListChecks class="size-3.5 mr-1" />
			Tarefas ({todos.length})
		</button>
		<button
			type="button"
			class="tab text-xs sm:text-sm font-medium {activeTab === 'kanban' ? 'tab-active' : ''}"
			onclick={() => (activeTab = 'kanban')}
			data-testid="tab-kanban"
		>
			<Kanban class="size-3.5 mr-1" />
			Kanban ({kanbanCards.length})
		</button>
		<button
			type="button"
			class="tab text-xs sm:text-sm font-medium {activeTab === 'poker' ? 'tab-active' : ''}"
			onclick={() => (activeTab = 'poker')}
			data-testid="tab-poker"
		>
			<Dices class="size-3.5 mr-1" />
			Poker ({pokerTasks.length})
		</button>
		<button
			type="button"
			class="tab text-xs sm:text-sm font-medium {activeTab === 'specs' ? 'tab-active' : ''}"
			onclick={() => (activeTab = 'specs')}
			data-testid="tab-specs"
		>
			<FileText class="size-3.5 mr-1" />
			Especificações ({specDocs.length})
		</button>
		<button
			type="button"
			class="tab text-xs sm:text-sm font-medium {activeTab === 'retro' ? 'tab-active' : ''}"
			onclick={() => (activeTab = 'retro')}
			data-testid="tab-retro"
		>
			<MessageSquareQuote class="size-3.5 mr-1" />
			Retrospectivas ({retroCards.length})
		</button>
	</div>

	<!-- Conteúdo Agregado -->
	{#if totalItems === 0}
		<div
			class="flex flex-col items-center justify-center py-16 px-4 bg-base-200/50 border border-base-300 rounded-2xl text-center"
			data-testid="category-detail-empty"
		>
			<div class="size-14 rounded-2xl bg-base-300 flex items-center justify-center text-base-content/40 mb-3">
				<Tag class="size-7" />
			</div>
			<h3 class="text-base font-semibold text-base-content/80">Nenhum item associado</h3>
			<p class="text-xs text-base-content/50 max-w-sm mt-1">
				Esta categoria ainda não foi vinculada a nenhuma tarefa, cartão de kanban, poker, especificação ou retrospectiva.
			</p>
		</div>
	{:else}
		<div class="space-y-8" data-testid="aggregated-sections">
			<!-- Seção: Tarefas (Todos) -->
			{#if (activeTab === 'all' || activeTab === 'todos') && todos.length > 0}
				<div class="card bg-base-100 border border-base-300" data-testid="section-todos">
					<div class="card-body p-5">
						<div class="flex items-center justify-between pb-3 border-b border-base-200">
							<h3 class="font-bold text-base flex items-center gap-2">
								<ListChecks class="size-5 text-primary" />
								Listas de Afazeres (Todos)
								<span class="badge badge-sm badge-neutral">{todos.length}</span>
							</h3>
						</div>
						<div class="divide-y divide-base-200 mt-2">
							{#each todos as item (item.id)}
								<div class="py-2.5 flex items-center justify-between gap-3 group">
									<div class="flex items-center gap-2.5 min-w-0">
										{#if item.done}
											<CheckCircle2 class="size-4 text-success shrink-0" />
											<span class="line-through text-base-content/50 text-sm truncate">{item.description}</span>
										{:else}
											<Circle class="size-4 text-base-content/30 shrink-0" />
											<span class="text-sm text-base-content truncate">{item.description}</span>
										{/if}
									</div>
									{#if item.expand?.list}
										<a
											href="/todos/{item.expand.list.id}"
											class="btn btn-ghost btn-xs gap-1 text-primary shrink-0 opacity-80 group-hover:opacity-100"
											title="Abrir lista"
										>
											<span class="max-w-[120px] truncate">{item.expand.list.title}</span>
											<ExternalLink class="size-3" />
										</a>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/if}

			<!-- Seção: Kanban Cards -->
			{#if (activeTab === 'all' || activeTab === 'kanban') && kanbanCards.length > 0}
				<div class="card bg-base-100 border border-base-300" data-testid="section-kanban">
					<div class="card-body p-5">
						<div class="flex items-center justify-between pb-3 border-b border-base-200">
							<h3 class="font-bold text-base flex items-center gap-2">
								<Kanban class="size-5 text-secondary" />
								Cartões do Quadro Kanban
								<span class="badge badge-sm badge-neutral">{kanbanCards.length}</span>
							</h3>
						</div>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
							{#each kanbanCards as card (card.id)}
								<div class="p-3 bg-base-200/60 rounded-xl border border-base-300 flex flex-col justify-between">
									<div>
										<div class="flex items-start justify-between gap-2 mb-1.5">
											<h4 class="font-semibold text-sm text-base-content truncate">{card.title}</h4>
											{#if card.expand?.column}
												<span class="badge badge-xs badge-ghost shrink-0">{card.expand.column.name}</span>
											{/if}
										</div>
										{#if card.description}
											<p class="text-xs text-base-content/60 line-clamp-2">{card.description}</p>
										{/if}
									</div>
									<div class="flex items-center justify-between mt-3 pt-2 border-t border-base-300/60 text-xs text-base-content/50">
										<span>{card.expand?.project?.title || 'Projeto'}</span>
										<a
											href="/kanban?project={card.project}"
											class="btn btn-ghost btn-xs gap-1 text-primary"
											data-testid="link-kanban-card-{card.id}"
										>
											Ver no Kanban
											<ExternalLink class="size-3" />
										</a>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/if}

			<!-- Seção: Planning Poker -->
			{#if (activeTab === 'all' || activeTab === 'poker') && pokerTasks.length > 0}
				<div class="card bg-base-100 border border-base-300" data-testid="section-poker">
					<div class="card-body p-5">
						<div class="flex items-center justify-between pb-3 border-b border-base-200">
							<h3 class="font-bold text-base flex items-center gap-2">
								<Dices class="size-5 text-accent" />
								Tarefas de Planning Poker
								<span class="badge badge-sm badge-neutral">{pokerTasks.length}</span>
							</h3>
						</div>
						<div class="divide-y divide-base-200 mt-2">
							{#each pokerTasks as task (task.id)}
								<div class="py-2.5 flex items-center justify-between gap-3 group">
									<div class="flex items-center gap-2.5 min-w-0">
										<span class="badge badge-sm badge-outline shrink-0">
											{task.final_points !== null ? `${task.final_points} pts` : task.status}
										</span>
										<span class="text-sm font-medium truncate text-base-content">{task.title}</span>
									</div>
									{#if task.room}
										<a
											href="/poker/{task.room}"
											class="btn btn-ghost btn-xs gap-1 text-primary shrink-0"
											title="Abrir sala de poker"
										>
											<span>{task.expand?.room?.name || 'Sala'}</span>
											<ExternalLink class="size-3" />
										</a>
									{:else}
										<a
											href="/poker/backlog"
											class="btn btn-ghost btn-xs gap-1 text-primary shrink-0"
										>
											Backlog
											<ExternalLink class="size-3" />
										</a>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/if}

			<!-- Seção: Especificações -->
			{#if (activeTab === 'all' || activeTab === 'specs') && specDocs.length > 0}
				<div class="card bg-base-100 border border-base-300" data-testid="section-specs">
					<div class="card-body p-5">
						<div class="flex items-center justify-between pb-3 border-b border-base-200">
							<h3 class="font-bold text-base flex items-center gap-2">
								<FileText class="size-5 text-info" />
								Documentos de Especificação
								<span class="badge badge-sm badge-neutral">{specDocs.length}</span>
							</h3>
						</div>
						<div class="divide-y divide-base-200 mt-2">
							{#each specDocs as doc (doc.id)}
								<div class="py-2.5 flex items-center justify-between gap-3 group">
									<div class="min-w-0">
										<h4 class="text-sm font-semibold text-base-content truncate">{doc.title}</h4>
										<span class="text-xs text-base-content/50">{doc.expand?.project?.title || 'Projeto'}</span>
									</div>
									<a
										href="/projects/{doc.project}/specs/{doc.id}"
										class="btn btn-ghost btn-xs gap-1 text-primary shrink-0"
									>
										Abrir Doc
										<ExternalLink class="size-3" />
									</a>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/if}

			<!-- Seção: Retrospectivas -->
			{#if (activeTab === 'all' || activeTab === 'retro') && retroCards.length > 0}
				<div class="card bg-base-100 border border-base-300" data-testid="section-retro">
					<div class="card-body p-5">
						<div class="flex items-center justify-between pb-3 border-b border-base-200">
							<h3 class="font-bold text-base flex items-center gap-2">
								<MessageSquareQuote class="size-5 text-warning" />
								Cartões de Retrospectiva
								<span class="badge badge-sm badge-neutral">{retroCards.length}</span>
							</h3>
						</div>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
							{#each retroCards as rCard (rCard.id)}
								<div class="p-3 bg-base-200/60 rounded-xl border border-base-300 flex flex-col justify-between">
									<div>
										<div class="flex items-center justify-between gap-2 mb-1">
											<span class="badge badge-xs badge-ghost">{rCard.expand?.column?.name || 'Coluna'}</span>
										</div>
										<p class="text-xs text-base-content/80 line-clamp-3">{rCard.content}</p>
									</div>
									{#if rCard.expand?.retro}
										<div class="flex items-center justify-end mt-2 pt-2 border-t border-base-300/60">
											<a
												href="/projects/{rCard.expand.retro.project}/sprints/{rCard.expand.retro.sprint}/retro"
												class="btn btn-ghost btn-xs gap-1 text-primary"
											>
												Ver no Board
												<ExternalLink class="size-3" />
											</a>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</PageShell>

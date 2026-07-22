<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import { createBrowserClient } from '$lib/client/pocketbaseClient';
	import { PlanningPokerRoom } from '$lib/domain/PlanningPokerRoom.svelte';
	import CardDeck from '$lib/components/planning-poker/CardDeck.svelte';
	import ParticipantsList from '$lib/components/planning-poker/ParticipantsList.svelte';
	import VoteResults from '$lib/components/planning-poker/VoteResults.svelte';
	import TaskList from '$lib/components/planning-poker/TaskList.svelte';
	import TaskEditor from '$lib/components/planning-poker/TaskEditor.svelte';
	import Dices from 'lucide-svelte/icons/dices';
	import LogOut from 'lucide-svelte/icons/log-out';
	import HelpCircle from 'lucide-svelte/icons/help-circle';
	import X from 'lucide-svelte/icons/x';
	import type {
		PokerRoomRecord,
		PokerParticipantRecord,
		PokerTaskRecord,
		PokerVoteRecord
	} from '$lib/server/pokerRecord';

	let { data }: PageProps = $props();

	let showLinkGlobalModal = $state(false);
	let taskToEdit = $state<{ id: string; title: string; description: string } | null>(null);
	let showEditTaskModal = $state(false);

	// Inicializa o browser SDK do PocketBase
	const pb = createBrowserClient(data.pbToken, data.pbRecord);

	// Inicializa a classe de estado reativo
	const pPokerRoom: PlanningPokerRoom = new PlanningPokerRoom(
		data.room as unknown as PokerRoomRecord,
		data.participants as unknown as PokerParticipantRecord[],
		data.tasks as unknown as PokerTaskRecord[],
		data.votes as unknown as PokerVoteRecord[],
		data.user!.id,
		(onRoom, onParticipant, onTask, onVote) => {
			// Subscreve na sala
			pb.collection('poker_rooms').subscribe(data.room.id, (e) => {
				if (e.action === 'update') onRoom(e.record as any);
			});

			// Subscreve nos participantes
			pb.collection('poker_participants').subscribe('*', (e) => {
				if (e.record.room === data.room.id) {
					if (e.action === 'create' || e.action === 'update') {
						onParticipant(e.record as any);
					}
				}
			});

			// Subscreve nas tasks
			pb.collection('poker_tasks').subscribe('*', (e) => {
				if (e.record.room === data.room.id) {
					if (e.action === 'create' || e.action === 'update') {
						onTask(e.record as any);
					}
				}
			});

			// Subscreve nos votos
			pb.collection('poker_votes').subscribe('*', (e) => {
				if (e.record.room === data.room.id) {
					if (e.action === 'create' || e.action === 'update') {
						onVote(e.record as any);
					}
				}
			});

			// Função de refetch de todos os votos
			const refetchVotes = async (): Promise<PokerVoteRecord[]> => {
				return (await pb.collection('poker_votes').getFullList({
					filter: pb.filter('room = {:roomId} && task = {:taskId}', {
						roomId: data.room.id,
						taskId: pPokerRoom.room?.current_task || ''
					})
				})) as unknown as PokerVoteRecord[];
			};

			return {
				unsubRoom: () => pb.collection('poker_rooms').unsubscribe(data.room.id),
				unsubParticipants: () => pb.collection('poker_participants').unsubscribe('*'),
				unsubTasks: () => pb.collection('poker_tasks').unsubscribe('*'),
				unsubVotes: () => pb.collection('poker_votes').unsubscribe('*'),
				refetchVotes
			};
		}
	);

	let selectedVote = $state('');
	let showCreateTaskModal = $state(false);

	// Sempre que a task muda, limpa o voto selecionado na UI
	$effect(() => {
		const currentTask = pPokerRoom.currentTask;
		if (currentTask) {
			// Busca se o usuário logado já votou e qual valor
			const myVote = pPokerRoom.votes.find((v: PokerVoteRecord) => v.user === data.user!.id);
			selectedVote = myVote ? myVote.value : '';
		} else {
			selectedVote = '';
		}
	});

	// Ao montar a página, marca o participante como online
	onMount(async () => {
		if (pPokerRoom.myParticipant) {
			try {
				await pb.collection('poker_participants').update(pPokerRoom.myParticipant.id, {
					is_online: true
				});
			} catch (e) {
				console.error('Falha ao definir status online:', e);
			}
		}
	});

	onDestroy(() => {
		pPokerRoom.destroy();
	});

	// Form actions wrappers usando fetch para evitar page reloads
	async function handleVote(value: string) {
		const formData = new FormData();
		formData.set('value', value);
		await fetch('?/vote', { method: 'POST', body: formData });
	}

	async function handleReveal() {
		await fetch('?/reveal', { method: 'POST', body: new FormData() });
	}

	async function handleResetVotes() {
		await fetch('?/resetVotes', { method: 'POST', body: new FormData() });
	}

	async function handleSelectTask(taskId: string) {
		const formData = new FormData();
		formData.set('taskId', taskId);
		await fetch('?/setTask', { method: 'POST', body: formData });
	}

	async function handleSetPoints(taskId: string, points: number | null) {
		const formData = new FormData();
		formData.set('taskId', taskId);
		formData.set('points', points !== null ? String(points) : '');
		await fetch('?/setFinalPoints', { method: 'POST', body: formData });
	}

	async function handleChangeRole(participantId: string, role: string) {
		const formData = new FormData();
		formData.set('participantId', participantId);
		formData.set('role', role);
		await fetch('?/changeRole', { method: 'POST', body: formData });
	}

	async function handleKick(participantId: string) {
		const formData = new FormData();
		formData.set('participantId', participantId);
		await fetch('?/removeParticipant', { method: 'POST', body: formData });
	}

	async function handleCreateTask(taskData: { title: string; description: string }) {
		const formData = new FormData();
		formData.set('title', taskData.title);
		formData.set('description', taskData.description);
		await fetch('?/createTask', { method: 'POST', body: formData });
	}

	async function handleExport(taskIds: string[]) {
		const formData = new FormData();
		for (const id of taskIds) {
			formData.append('taskIds', id);
		}
		await fetch('?/exportToKanban', { method: 'POST', body: formData });
	}

	async function handleFinalize() {
		await fetch('?/finalize', { method: 'POST', body: new FormData() });
	}

	async function handleRemoveFromVoting(taskId: string) {
		const formData = new FormData();
		formData.set('taskId', taskId);
		await fetch('?/removeTaskFromVoting', { method: 'POST', body: formData });
	}

	async function handleLinkGlobal(taskIds: string[]) {
		const formData = new FormData();
		for (const id of taskIds) {
			formData.append('taskIds', id);
		}
		await fetch('?/linkGlobalTasks', { method: 'POST', body: formData });
	}

	async function handleEditTask(taskData: { id: string; title: string; description: string }) {
		const formData = new FormData();
		formData.set('taskId', taskData.id);
		formData.set('title', taskData.title);
		formData.set('description', taskData.description);
		await fetch('?/editTask', { method: 'POST', body: formData });
	}

	function openEditTaskModal(task: PokerTaskRecord) {
		taskToEdit = {
			id: task.id,
			title: task.title,
			description: task.description || ''
		};
		showEditTaskModal = true;
	}
</script>

<svelte:window
	onbeforeunload={async () => {
		if (pPokerRoom.myParticipant) {
			// Envia atualização de offline síncrona/beacon se possível, ou patch rápido
			await pb.collection('poker_participants').update(pPokerRoom.myParticipant.id, {
				is_online: false
			});
		}
	}}
/>

<div class="mx-auto w-full max-w-7xl p-4 flex flex-col gap-6">
	<!-- Navbar da Sala -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-base-200 border border-base-300 p-6 rounded-2xl">
		<div class="flex items-center gap-3">
			<Dices class="w-8 h-8 text-primary" />
			<div>
				<h1 class="text-2xl font-black tracking-tight text-base-content/90">
					{pPokerRoom.room?.name}
					{#if pPokerRoom.room?.status === 'finalized'}
						<span class="badge badge-error badge-sm ml-2 font-bold uppercase" data-testid="badge-finalized">Finalizada</span>
					{/if}
				</h1>
				<p class="text-xs text-base-content/50 mt-0.5">Planning Poker Room</p>
			</div>
		</div>
		<div class="flex flex-wrap items-center gap-2">
			{#if pPokerRoom.myParticipant?.role === 'admin' && pPokerRoom.room?.status === 'open'}
				<button
					class="btn btn-outline btn-warning btn-sm"
					onclick={() => (showLinkGlobalModal = true)}
					data-testid="btn-open-link-global"
				>
					Vincular Backlog Global
				</button>
				<button
					class="btn btn-error btn-sm"
					onclick={handleFinalize}
					data-testid="btn-finalize-room"
				>
					Finalizar Sala
				</button>
			{/if}
			<form method="POST" action="?/leaveRoom" use:enhance>
				<button class="btn btn-error btn-sm btn-outline flex items-center gap-1.5" data-testid="btn-leave-room">
					<LogOut class="w-4 h-4" />
					Sair da Sala
				</button>
			</form>
		</div>
	</div>

	<!-- Grid Principal -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
		<!-- Esquerda: Task Atual, Baralho, Resultados -->
		<div class="lg:col-span-2 flex flex-col gap-6">
			<!-- Task em votação -->
			<div class="bg-base-200 border border-base-300 rounded-2xl p-6">
				<h3 class="text-sm font-semibold uppercase tracking-wider text-base-content/60 mb-4">
					Tarefa em Votação
				</h3>

				{#if pPokerRoom.currentTask}
					<div class="bg-base-100 border border-base-300 p-6 rounded-xl space-y-4">
						<h2 class="text-xl font-extrabold text-base-content/90">{pPokerRoom.currentTask.title}</h2>
						{#if pPokerRoom.currentTask.description}
							<div class="prose prose-sm prose-neutral max-w-none text-base-content/70">
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								{@html pPokerRoom.currentTask.description}
							</div>
						{/if}
					</div>
				{:else}
					<div class="flex flex-col items-center justify-center py-10 px-4 bg-base-100 border border-base-300 rounded-xl text-center text-base-content/40 text-sm">
						<HelpCircle class="w-10 h-10 text-base-content/20 mb-2" />
						Aguardando o Responsável selecionar uma tarefa para votação...
					</div>
				{/if}
			</div>

			<!-- Baralho de Votação -->
			<CardDeck
				bind:selectedValue={selectedVote}
				disabled={!pPokerRoom.currentTask ||
					pPokerRoom.room?.revealed ||
					pPokerRoom.room?.status === 'finalized' ||
					pPokerRoom.myParticipant?.role === 'spectator'}
				onVote={handleVote}
			/>

			<!-- Resultados -->
			{#if pPokerRoom.room?.revealed}
				<VoteResults
					average={pPokerRoom.numericAverage}
					distribution={pPokerRoom.distribution}
					totalVotes={pPokerRoom.votes.length}
				/>
			{:else if pPokerRoom.currentTask}
				<div class="bg-base-200 border border-base-300 rounded-2xl p-6 flex flex-col items-center justify-center py-12 text-center">
					<span class="text-4xl mb-4">🗳️</span>
					<h3 class="text-md font-bold text-base-content/85">Cartas Ocultas</h3>
					<p class="text-sm text-base-content/50 max-w-sm mt-1 mb-6">
						Os votos estão sendo computados em tempo real. Revele as cartas para ver o resultado!
					</p>

					<!-- Ação de Revelar -->
					{#if (pPokerRoom.myParticipant?.role === 'admin' || pPokerRoom.allVotersVoted) && pPokerRoom.room?.status === 'open'}
						<button
							class="btn btn-primary"
							onclick={handleReveal}
							data-testid="btn-reveal-votes"
						>
							Revelar Votos
						</button>
					{/if}
				</div>
			{/if}

			<!-- Ações do Administrador para a Rodada -->
			{#if pPokerRoom.myParticipant?.role === 'admin' && pPokerRoom.currentTask && pPokerRoom.room?.status === 'open'}
				<div class="flex flex-wrap gap-2 justify-end">
					{#if pPokerRoom.room?.revealed}
						<button
							class="btn btn-neutral btn-sm"
							onclick={handleResetVotes}
							data-testid="btn-reset-votes"
						>
							Reiniciar Rodada
						</button>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Direita: Participantes, Backlog -->
		<div class="flex flex-col gap-6">
			<!-- Lista de Participantes -->
			<ParticipantsList
				participants={pPokerRoom.participants}
				votes={pPokerRoom.votes}
				revealed={pPokerRoom.room?.revealed ?? false}
				isAdmin={pPokerRoom.myParticipant?.role === 'admin'}
				currentUserId={data.user!.id}
				onChangeRole={handleChangeRole}
				onKick={handleKick}
			/>

			<!-- Backlog de Tarefas -->
			<TaskList
				tasks={pPokerRoom.tasks}
				currentTaskId={pPokerRoom.room?.current_task || ''}
				isAdmin={pPokerRoom.myParticipant?.role === 'admin'}
				roomStatus={pPokerRoom.room?.status ?? 'open'}
				onSelectTask={handleSelectTask}
				onSetPoints={handleSetPoints}
				onExport={handleExport}
				onRemoveFromVoting={handleRemoveFromVoting}
				onEditTask={openEditTaskModal}
				onCreateTask={() => (showCreateTaskModal = true)}
			/>
		</div>
	</div>
</div>

<!-- Modal para criar Task -->
<TaskEditor
	bind:show={showCreateTaskModal}
	onCreateTask={handleCreateTask}
/>

<!-- Modal para editar Task -->
{#if showEditTaskModal}
	<TaskEditor
		bind:show={showEditTaskModal}
		task={taskToEdit}
		onCreateTask={handleCreateTask}
		onSaveTask={handleEditTask}
	/>
{/if}

<!-- Modal para Vincular tarefas do Backlog Global -->
{#if showLinkGlobalModal}
	<div class="modal modal-open bg-black/60 backdrop-blur-xs flex items-center justify-center z-50">
		<div class="modal-box max-w-md border border-base-300 bg-base-100 p-6 flex flex-col max-h-[80vh]">
			<div class="flex justify-between items-center mb-6">
				<h3 class="font-bold text-lg text-base-content flex items-center gap-2">
					Vincular tarefas do Backlog Global
				</h3>
				<button class="btn btn-ghost btn-circle btn-sm" onclick={() => (showLinkGlobalModal = false)}>
					<X class="w-4 h-4" />
				</button>
			</div>

			{#if !data.globalTasks || data.globalTasks.length === 0}
				<div class="text-center py-8 text-sm text-base-content/50">
					Nenhuma tarefa disponível no Backlog Global para vinculação.
				</div>
				<div class="modal-action flex justify-end">
					<button type="button" class="btn" onclick={() => (showLinkGlobalModal = false)}>Fechar</button>
				</div>
			{:else}
				<form
					onsubmit={(e) => {
						e.preventDefault();
						const formEl = e.currentTarget as HTMLFormElement;
						const selectedCheckboxes = formEl.querySelectorAll('input[name="taskIds"]:checked') as NodeListOf<HTMLInputElement>;
						const taskIds = Array.from(selectedCheckboxes).map(cb => cb.value);
						if (taskIds.length > 0) {
							handleLinkGlobal(taskIds);
						}
						showLinkGlobalModal = false;
					}}
					class="space-y-4 overflow-y-auto flex-1 pr-1"
				>
					<div class="space-y-2 max-h-60 overflow-y-auto border border-base-300 rounded-lg p-3 bg-base-200">
						{#each data.globalTasks as task}
							<label class="flex items-start gap-2.5 cursor-pointer hover:bg-base-300 p-1.5 rounded-sm">
								<input
									type="checkbox"
									name="taskIds"
									value={task.id}
									class="checkbox checkbox-sm mt-0.5 checkbox-primary"
								/>
								<span class="text-xs font-semibold text-base-content/90">{task.title}</span>
							</label>
						{/each}
					</div>

					<div class="modal-action flex justify-end gap-2 mt-6 shrink-0">
						<button type="button" class="btn btn-ghost" onclick={() => (showLinkGlobalModal = false)}>
							Cancelar
						</button>
						<button type="submit" class="btn btn-primary" data-testid="btn-submit-link-global">
							Vincular Selecionadas
						</button>
					</div>
				</form>
			{/if}
		</div>
	</div>
{/if}

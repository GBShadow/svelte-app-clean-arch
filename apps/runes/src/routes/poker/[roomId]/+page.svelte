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
	import { Dices, LogOut, Plus, HelpCircle } from 'lucide-svelte';
	import type {
		PokerRoomRecord,
		PokerParticipantRecord,
		PokerTaskRecord,
		PokerVoteRecord
	} from '$lib/server/pokerRecord';

	let { data }: PageProps = $props();

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
				<h1 class="text-2xl font-black tracking-tight text-base-content/90">{pPokerRoom.room?.name}</h1>
				<p class="text-xs text-base-content/50 mt-0.5">Planning Poker Room</p>
			</div>
		</div>
		<form method="POST" action="?/leaveRoom" use:enhance>
			<button class="btn btn-error btn-sm btn-outline flex items-center gap-1.5" data-testid="btn-leave-room">
				<LogOut class="w-4 h-4" />
				Sair da Sala
			</button>
		</form>
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
					{#if pPokerRoom.myParticipant?.role === 'admin' || pPokerRoom.allVotersVoted}
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
			{#if pPokerRoom.myParticipant?.role === 'admin' && pPokerRoom.currentTask}
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
			<div class="relative">
				<TaskList
					tasks={pPokerRoom.tasks}
					currentTaskId={pPokerRoom.room?.current_task || ''}
					isAdmin={pPokerRoom.myParticipant?.role === 'admin'}
					onSelectTask={handleSelectTask}
					onSetPoints={handleSetPoints}
					onExport={handleExport}
				/>
				<button
					class="btn btn-ghost btn-xs absolute top-6 right-6 flex items-center gap-1 text-primary hover:bg-base-300"
					onclick={() => (showCreateTaskModal = true)}
					data-testid="btn-open-create-task"
				>
					<Plus class="w-3.5 h-3.5" />
					Nova Task
				</button>
			</div>
		</div>
	</div>
</div>

<!-- Modal para criar Task -->
<TaskEditor
	bind:show={showCreateTaskModal}
	onCreateTask={handleCreateTask}
/>

<script lang="ts">
	import Avatar from '$lib/components/Avatar.svelte';
	import { Users, Shield, User, HelpCircle, Check, LogOut, Trash2 } from 'lucide-svelte';
	import type { PokerParticipantRecord, PokerVoteRecord } from '$lib/server/pokerRecord';

	let {
		participants = [],
		votes = [],
		revealed = false,
		isAdmin = false,
		currentUserId = '',
		onChangeRole,
		onKick
	} = $props();

	function getVoteValue(userId: string): string | undefined {
		return votes.find((v) => v.user === userId)?.value;
	}

	function hasVoted(userId: string): boolean {
		return votes.some((v) => v.user === userId);
	}
</script>

<div class="bg-base-200 border border-base-300 rounded-2xl p-6">
	<h3 class="text-sm font-semibold uppercase tracking-wider text-base-content/60 mb-6 flex items-center gap-2">
		<Users class="w-4 h-4 text-primary" />
		Participantes ({participants.length})
	</h3>

	<div class="space-y-4">
		{#each participants as part}
			<div class="flex items-center justify-between gap-4 p-3 bg-base-100 border border-base-300 rounded-xl">
				<div class="flex items-center gap-3 min-w-0">
					<div class="relative">
						<Avatar
							name={part.expand?.user?.name || 'Votante'}
							userId={part.expand?.user?.id || ''}
							avatar={part.expand?.user?.avatar || ''}
							size="size-9"
						/>
						<span
							class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-base-100
								{part.is_online ? 'bg-success' : 'bg-base-content/20'}"
							title={part.is_online ? 'Online' : 'Offline'}
						></span>
					</div>

					<div class="min-w-0">
						<div class="flex items-center gap-2">
							<span class="font-bold text-sm text-base-content/95 truncate">
								{part.expand?.user?.name || 'Votante'}
							</span>
							{#if part.user === currentUserId}
								<span class="badge badge-sm badge-neutral text-[10px]">Você</span>
							{/if}
						</div>
						<div class="flex items-center gap-1.5 text-xs text-base-content/50 mt-0.5">
							{#if part.role === 'admin'}
								<Shield class="w-3.5 h-3.5 text-warning" />
								<span>Responsável</span>
							{:else if part.role === 'spectator'}
								<HelpCircle class="w-3.5 h-3.5 text-info" />
								<span>Espectador</span>
							{:else}
								<User class="w-3.5 h-3.5 text-success" />
								<span>Votante</span>
							{/if}
						</div>
					</div>
				</div>

				<div class="flex items-center gap-2">
					<!-- Indicador de Voto -->
					{#if part.role !== 'spectator'}
						{#if revealed}
							{@const vote = getVoteValue(part.user)}
							{#if vote}
								<div class="w-9 h-9 border border-primary bg-primary/10 text-primary rounded-lg flex items-center justify-center font-black text-sm">
									{vote}
								</div>
							{:else}
								<div class="w-9 h-9 border border-base-300 bg-base-200 text-base-content/30 rounded-lg flex items-center justify-center text-xs">
									—
								</div>
							{/if}
						{:else if hasVoted(part.user)}
							<div class="w-9 h-9 border border-success/30 bg-success/10 text-success rounded-lg flex items-center justify-center" title="Já votou">
								<Check class="w-5 h-5" />
							</div>
						{:else}
							<div class="w-9 h-9 border border-base-300 border-dashed rounded-lg flex items-center justify-center text-base-content/20" title="Aguardando voto">
								⏳
							</div>
						{/if}
					{/if}

					<!-- Ações administrativas (Apenas se quem está vendo for Admin e o participante editado não for ele mesmo) -->
					{#if isAdmin && part.user !== currentUserId}
						<div class="dropdown dropdown-end">
							<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
							<button tabindex="0" class="btn btn-ghost btn-xs btn-circle font-bold">⋮</button>
							<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
							<ul tabindex="0" class="dropdown-content menu p-2 shadow-lg bg-base-200 border border-base-300 rounded-box w-52 z-30">
								<li>
									<button onclick={() => onChangeRole(part.id, 'admin')} class="flex items-center gap-2">
										<Shield class="w-4 h-4 text-warning" />
										Tornar Responsável
									</button>
								</li>
								<li>
									<button onclick={() => onChangeRole(part.id, 'voter')} class="flex items-center gap-2">
										<User class="w-4 h-4 text-success" />
										Tornar Votante
									</button>
								</li>
								<li>
									<button onclick={() => onChangeRole(part.id, 'spectator')} class="flex items-center gap-2">
										<HelpCircle class="w-4 h-4 text-info" />
										Tornar Espectador
									</button>
								</li>
								<div class="divider my-1"></div>
								<li>
									<button onclick={() => onKick(part.id)} class="text-error flex items-center gap-2 hover:bg-error/10">
										<Trash2 class="w-4 h-4" />
										Remover da Sala
									</button>
								</li>
							</ul>
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>

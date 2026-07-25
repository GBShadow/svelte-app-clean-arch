<script lang="ts">
	import type { RetroParticipantRecord } from '$lib/server/retroRecord';
	import type { UserRecord } from '$lib/server/userRecord';

	let {
		participants = [],
		projectUsers = [],
		canManage = false,
		showAddForm = false,
		participantUserId = '',
		message = '',
		onToggleForm,
		onUserIdChange,
		onAddParticipant,
		onRemoveParticipant
	}: {
		participants: RetroParticipantRecord[];
		projectUsers: UserRecord[];
		canManage: boolean;
		showAddForm: boolean;
		participantUserId: string;
		message: string;
		onToggleForm: () => void;
		onUserIdChange: (id: string) => void;
		onAddParticipant: () => void;
		onRemoveParticipant: (participantId: string) => void;
	} = $props();

	const participantUsers = $derived(
		participants
			.map((p) => {
				const user = projectUsers.find((u) => u.id === p.user);
				return { ...p, userRecord: user };
			})
			.filter((p) => p.userRecord)
	);

	const availableUsers = $derived(
		projectUsers.filter(
			(u) => !participants.some((p) => p.user === u.id)
		)
	);
</script>

<div class="bg-base-100 rounded-box shadow p-4 max-w-xs">
	<h3 class="font-semibold text-sm mb-2">Participantes ({participants.length})</h3>

	{#if message}
		<p class="text-xs text-success mb-2">{message}</p>
	{/if}

	<div class="flex flex-wrap gap-2 mb-3">
		{#each participantUsers as p (p.id)}
			<div class="flex items-center gap-1 badge badge-outline">
				<div class="avatar avatar-xs">
					<div class="w-5 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs">
						{p.userRecord?.name?.charAt(0) ?? '?'}
					</div>
				</div>
				<span class="text-xs">{p.userRecord?.name ?? 'Desconhecido'}</span>
				{#if canManage}
					<button
						class="btn btn-ghost btn-xs btn-square text-error"
						onclick={() => onRemoveParticipant(p.id)}
						title="Remover"
					>&#10005;</button>
				{/if}
			</div>
		{/each}
	</div>

	{#if canManage}
		{#if showAddForm}
			<div class="flex gap-1">
				<select
					class="select select-bordered select-xs flex-1"
					value={participantUserId}
					onchange={(e) => onUserIdChange((e.target as HTMLSelectElement).value)}
				>
					<option value="">Selecionar usuário...</option>
					{#each availableUsers as u (u.id)}
						<option value={u.id}>{u.name}</option>
					{/each}
				</select>
				<button class="btn btn-primary btn-xs" onclick={onAddParticipant}>Adicionar</button>
				<button class="btn btn-ghost btn-xs" onclick={onToggleForm}>Cancelar</button>
			</div>
		{:else}
			<button class="btn btn-outline btn-xs w-full" onclick={onToggleForm}>
				+ Adicionar participante
			</button>
		{/if}
	{/if}
</div>

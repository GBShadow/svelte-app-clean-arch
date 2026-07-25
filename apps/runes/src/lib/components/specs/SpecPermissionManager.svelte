<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SpecPermissionRecord } from '$lib/server/specRecord';
	import type { UserRecord } from '$lib/server/userRecord';

	let {
		documentId,
		permissions = [],
		users = []
	}: {
		documentId: string;
		permissions: SpecPermissionRecord[];
		users: UserRecord[];
	} = $props();

	let selectedUserId = $state('');
	let selectedRole: 'view' | 'edit' = 'view';
	let message = $state('');

	const permissionUsers = $derived(
		permissions
			.map((p) => {
				const user = users.find((u) => u.id === p.user);
				return { ...p, userName: user?.name ?? 'Desconhecido' };
			})
	);

	const availableUsers = $derived(
		users.filter((u) => !permissions.some((p) => p.user === u.id))
	);
</script>

<div class="mt-3 space-y-3">
	{#if message}
		<p class="text-xs text-success">{message}</p>
	{/if}

	<!-- Current permissions -->
	{#if permissionUsers.length > 0}
		<div class="space-y-1">
			{#each permissionUsers as perm (perm.id)}
				<div class="flex items-center gap-2 text-sm">
					<span class="flex-1">{perm.userName}</span>
					<span class="badge badge-sm">{perm.role === 'edit' ? 'Editar' : 'Ver'}</span>
					<form
						method="POST"
						action="?/removePermission"
						use:enhance
					>
						<input type="hidden" name="permissionId" value={perm.id} />
						<button class="btn btn-ghost btn-xs text-error">Remover</button>
					</form>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Add permission -->
	<div class="flex gap-1 items-end">
		<div>
			<select
				class="select select-bordered select-xs"
				bind:value={selectedUserId}
			>
				<option value="">Selecionar usuário...</option>
				{#each availableUsers as u (u.id)}
					<option value={u.id}>{u.name}</option>
				{/each}
			</select>
		</div>
		<div>
			<select
				class="select select-bordered select-xs"
				bind:value={selectedRole}
			>
				<option value="view">Ver</option>
				<option value="edit">Ver + Editar</option>
			</select>
		</div>
		<form
			method="POST"
			action="?/addPermission"
			use:enhance={() => {
				message = '';
				return async ({ update }) => update();
			}}
		>
			<input type="hidden" name="userId" value={selectedUserId} />
			<input type="hidden" name="role" value={selectedRole} />
			<button class="btn btn-primary btn-xs" type="submit" disabled={!selectedUserId}>
				Adicionar
			</button>
		</form>
	</div>
</div>

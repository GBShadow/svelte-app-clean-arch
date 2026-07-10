<script lang="ts">
	import type { UserRecord } from '$lib/server/userRecord';
	import IconEdit from '$lib/components/icons/IconEdit.svelte';

	let { users }: { users: UserRecord[] } = $props();
</script>

<table class="table table-zebra" data-testid="users-table">
	<thead>
		<tr>
			<th class="font-display">Nome</th>
			<th class="font-display">E-mail</th>
			<th class="font-display">Cargo</th>
			<th></th>
		</tr>
	</thead>
	<tbody>
		{#each users as user (user.id)}
			<tr data-testid="user-row-{user.id}">
				<td>{user.name}</td>
				<td class="font-mono text-sm">{user.email}</td>
				<td class="font-mono text-sm">{user.jobTitle}</td>
				<td class="text-right">
					<a href="/users/{user.id}/edit" class="link inline-flex items-center gap-1" data-testid="edit-user-{user.id}">
						<IconEdit class="size-3.5" />
						Editar
					</a>
				</td>
			</tr>
		{/each}
	</tbody>
</table>

{#if users.length === 0}
	<div class="empty-state mt-2">
		<div class="card-body">
			<p class="font-mono text-sm opacity-80" data-testid="no-users-msg">
				Nenhum usuário cadastrado ainda. Crie o primeiro usuário acima.
			</p>
		</div>
	</div>
{/if}

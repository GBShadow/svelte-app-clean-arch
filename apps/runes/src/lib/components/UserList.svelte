<script lang="ts">
	import type { UserRecord } from '$lib/server/userRecord';

	let { users }: { users: UserRecord[] } = $props();
</script>

<table class="table" data-testid="users-table">
	<thead>
		<tr>
			<th>Nome</th>
			<th>E-mail</th>
			<th>Cargo</th>
			<th></th>
		</tr>
	</thead>
	<tbody>
		{#each users as user (user.id)}
			<tr data-testid="user-row-{user.id}">
				<td>{user.name}</td>
				<td>{user.email}</td>
				<td>{user.jobTitle}</td>
				<td class="text-right">
					<a href="/users/{user.id}/edit" class="link" data-testid="edit-user-{user.id}">Editar</a>
				</td>
			</tr>
		{/each}
	</tbody>
</table>

{#if users.length === 0}
	<p class="opacity-70" data-testid="no-users-msg">Nenhum usuário cadastrado.</p>
{/if}

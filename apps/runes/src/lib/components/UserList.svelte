<script lang="ts">
	import type { UserRecord } from '$lib/server/userRecord';

	let { users }: { users: UserRecord[] } = $props();
</script>

<table class="table">
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
			<tr>
				<td>{user.name}</td>
				<td>{user.email}</td>
				<td>{user.jobTitle}</td>
				<td class="text-right">
					<a href="/users/{user.id}/edit" class="link">Editar</a>
				</td>
			</tr>
		{/each}
	</tbody>
</table>

{#if users.length === 0}
	<p class="opacity-70">Nenhum usuário cadastrado.</p>
{/if}

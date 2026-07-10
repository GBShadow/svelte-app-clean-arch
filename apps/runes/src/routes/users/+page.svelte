<script lang="ts">
	import UserList from '$lib/components/UserList.svelte';
	import IconPlus from '$lib/components/icons/IconPlus.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold font-display">Usuários</h1>
		<a href="/users/new" class="btn btn-primary btn-sm gap-1.5" data-testid="btn-new-user">
			<IconPlus class="size-4" />
			Novo usuário
		</a>
	</div>

	<div class="card bg-base-100 border border-base-300 shadow-sm" data-testid="users-list-card">
		<div class="card-body">
			<UserList users={data.users} />
		</div>
	</div>
</div>

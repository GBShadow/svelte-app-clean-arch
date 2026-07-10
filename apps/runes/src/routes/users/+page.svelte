<script lang="ts">
	import UserList from '$lib/components/UserList.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">Usuários</h1>
		<a href="/users/new" class="btn btn-primary btn-sm">Novo usuário</a>
	</div>

	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<UserList users={data.users} />
		</div>
	</div>
</div>

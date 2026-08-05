<script lang="ts">
	import UserList from '$lib/components/UserList.svelte';
	import IconPlus from '$lib/components/icons/IconPlus.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<PageShell width="lg" testId="users-page">
	<PageHeader title="Usuários">
		{#snippet children()}
			<a href="/users/new" class="btn btn-primary btn-sm gap-1.5" data-testid="btn-new-user">
				<IconPlus class="size-4" />
				Novo usuário
			</a>
		{/snippet}
	</PageHeader>

	<div class="card bg-base-100 border border-base-300 shadow-sm" data-testid="users-list-card">
		<div class="card-body">
			<UserList users={data.users} />
		</div>
	</div>
</PageShell>

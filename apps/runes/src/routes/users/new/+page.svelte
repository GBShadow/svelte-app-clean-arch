<script lang="ts">
	import UserForm from '$lib/components/UserForm.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<PageShell width="lg" testId="users-new-page">
	<PageHeader title="Novo usuário" />

	<form method="POST" novalidate data-testid="new-user-form" class="card bg-base-100 border border-base-300 shadow-sm">
		<div class="card-body gap-4">
			<UserForm values={form?.values} showPasswordFields errors={form?.errors ?? {}} testId="user-form-new" />
			<button type="submit" class="btn btn-primary mt-2" data-testid="btn-create-user">Criar</button>
		</div>
	</form>
</PageShell>

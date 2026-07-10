<script lang="ts">
	import UserForm from '$lib/components/UserForm.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="flex flex-col gap-4 max-w-lg">
	<h1 class="text-2xl font-bold">Novo usuário</h1>

	<form method="POST" class="card bg-base-100 shadow-xl">
		<div class="card-body gap-4">
			<UserForm values={form?.values} showPasswordFields errors={form?.errors ?? {}} />
			<button type="submit" class="btn btn-primary mt-2">Criar</button>
		</div>
	</form>
</div>

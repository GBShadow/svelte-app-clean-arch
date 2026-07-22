<script lang="ts">
	import { enhance } from '$app/forms';
	import { withToast } from '$lib/client/enhanceWithToast';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="flex flex-col gap-4 max-w-lg mx-auto w-full">
	<h1 class="text-2xl font-bold font-display">Nova lista</h1>

	<form method="POST" novalidate data-testid="new-list-form" class="card bg-base-100 border border-base-300 shadow-sm" use:enhance={withToast({ successMessage: 'Lista criada!' })}>
		<div class="card-body gap-4">
			{#if form?.errors?.general}
				<div class="alert alert-error" role="alert" data-testid="error-new-list">{form.errors.general}</div>
			{/if}

			<label class="form-control">
				<span class="label-text">Título</span>
				<input type="text" name="title" data-testid="input-title" class="input input-bordered w-full" required />
				{#if form?.errors?.title}
					<span class="text-error text-sm" data-testid="error-title">{form.errors.title}</span>
				{/if}
			</label>

			<button type="submit" class="btn btn-primary mt-2" data-testid="btn-create-list">Criar</button>
		</div>
	</form>
</div>

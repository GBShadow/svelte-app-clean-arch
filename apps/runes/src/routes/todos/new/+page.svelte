<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="flex flex-col gap-4 max-w-lg">
	<h1 class="text-2xl font-bold">Nova lista</h1>

	<form method="POST" class="card bg-base-100 shadow-xl">
		<div class="card-body gap-4">
			{#if form?.errors?.general}
				<div class="alert alert-error" role="alert">{form.errors.general}</div>
			{/if}

			<label class="form-control">
				<span class="label-text">Título</span>
				<input type="text" name="title" class="input input-bordered w-full" required />
				{#if form?.errors?.title}
					<span class="text-error text-sm">{form.errors.title}</span>
				{/if}
			</label>

			<button type="submit" class="btn btn-primary mt-2">Criar</button>
		</div>
	</form>
</div>

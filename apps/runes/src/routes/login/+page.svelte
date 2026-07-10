<script lang="ts">
	import { enhance } from '$app/forms';
	import { postAuthEvent } from '$lib/client/authChannel';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="hero min-h-[60vh]">
	<div class="hero-content w-full max-w-sm flex-col">
		<h1 class="text-3xl font-bold">Entrar</h1>

		<form
			method="POST"
			class="card w-full bg-base-100 shadow-xl"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'redirect') {
						postAuthEvent('login');
					}
					await update();
				};
			}}
		>
			<div class="card-body gap-4">
				{#if form?.error}
					<div class="alert alert-error" role="alert">{form.error}</div>
				{/if}

				<label class="form-control">
					<span class="label-text">E-mail</span>
					<input
						type="email"
						name="email"
						class="input input-bordered w-full"
						autocomplete="email"
						required
					/>
				</label>

				<label class="form-control">
					<span class="label-text">Senha</span>
					<input
						type="password"
						name="password"
						class="input input-bordered w-full"
						autocomplete="current-password"
						required
					/>
				</label>

				<button type="submit" class="btn btn-primary mt-2">Entrar</button>
			</div>
		</form>
	</div>
</div>

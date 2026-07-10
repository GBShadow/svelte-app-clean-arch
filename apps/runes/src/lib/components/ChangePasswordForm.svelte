<script lang="ts">
	let { errors = {} }: { errors?: Record<string, string> } = $props();
</script>

<form method="POST" class="card bg-base-100 shadow-xl w-full max-w-sm">
	<div class="card-body gap-4">
		{#if errors.general}
			<div class="alert alert-error" role="alert">{errors.general}</div>
		{/if}

		<label class="form-control">
			<span class="label-text">Senha atual</span>
			<input
				type="password"
				name="currentPassword"
				class="input input-bordered w-full"
				autocomplete="current-password"
				required
			/>
			{#if errors.currentPassword}
				<span class="text-error text-sm">{errors.currentPassword}</span>
			{/if}
		</label>

		<label class="form-control">
			<span class="label-text">Nova senha</span>
			<input
				type="password"
				name="password"
				class="input input-bordered w-full"
				autocomplete="new-password"
				required
			/>
			{#if errors.password}<span class="text-error text-sm">{errors.password}</span>{/if}
		</label>

		<label class="form-control">
			<span class="label-text">Confirmar nova senha</span>
			<input
				type="password"
				name="confirmPassword"
				class="input input-bordered w-full"
				autocomplete="new-password"
				required
			/>
			{#if errors.confirmPassword}
				<span class="text-error text-sm">{errors.confirmPassword}</span>
			{/if}
		</label>

		<button type="submit" class="btn btn-primary mt-2">Trocar senha</button>
	</div>
</form>

<script lang="ts">
	let { errors = {} }: { errors?: Record<string, string> } = $props();
</script>

<form method="POST" novalidate data-testid="change-password-form" class="card bg-base-100 shadow-xl w-full max-w-sm">
	<div class="card-body gap-4">
		{#if errors.general}
			<div class="alert alert-error" role="alert" data-testid="error-change-password">{errors.general}</div>
		{/if}

		<label class="form-control">
			<span class="label-text">Senha atual</span>
			<input
				type="password"
				name="currentPassword"
				data-testid="input-current-password"
				class="input input-bordered w-full"
				autocomplete="current-password"
				required
			/>
			{#if errors.currentPassword}
				<span class="text-error text-sm" data-testid="error-current-password">{errors.currentPassword}</span>
			{/if}
		</label>

		<label class="form-control">
			<span class="label-text">Nova senha</span>
			<input
				type="password"
				name="password"
				data-testid="input-password"
				class="input input-bordered w-full"
				autocomplete="new-password"
				required
			/>
			{#if errors.password}<span class="text-error text-sm" data-testid="error-password">{errors.password}</span>{/if}
		</label>

		<label class="form-control">
			<span class="label-text">Confirmar nova senha</span>
			<input
				type="password"
				name="confirmPassword"
				data-testid="input-confirm-password"
				class="input input-bordered w-full"
				autocomplete="new-password"
				required
			/>
			{#if errors.confirmPassword}
				<span class="text-error text-sm" data-testid="error-confirm-password">{errors.confirmPassword}</span>
			{/if}
		</label>

		<button type="submit" class="btn btn-primary mt-2" data-testid="btn-change-password">Trocar senha</button>
	</div>
</form>

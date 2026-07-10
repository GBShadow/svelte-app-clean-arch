<script lang="ts">
	type FormErrors = Record<string, string>;
	type UserValues = { name?: string; email?: string; jobTitle?: string };

	let {
		values = {},
		canEditEmail = true,
		showPasswordFields = false,
		errors = {}
	}: {
		values?: UserValues;
		canEditEmail?: boolean;
		showPasswordFields?: boolean;
		errors?: FormErrors;
	} = $props();
</script>

<div class="flex flex-col gap-4">
	{#if errors.general}
		<div class="alert alert-error" role="alert">{errors.general}</div>
	{/if}

	<label class="form-control">
		<span class="label-text">Nome</span>
		<input
			type="text"
			name="name"
			class="input input-bordered w-full"
			value={values.name ?? ''}
			required
		/>
		{#if errors.name}<span class="text-error text-sm">{errors.name}</span>{/if}
	</label>

	<label class="form-control">
		<span class="label-text">E-mail</span>
		<input
			type="email"
			name="email"
			class="input input-bordered w-full"
			value={values.email ?? ''}
			disabled={!canEditEmail}
			required
		/>
		{#if errors.email}<span class="text-error text-sm">{errors.email}</span>{/if}
	</label>

	<label class="form-control">
		<span class="label-text">Cargo</span>
		<select
			name="jobTitle"
			class="select select-bordered w-full"
			value={values.jobTitle ?? 'junior'}
		>
			<option value="senior">Senior</option>
			<option value="mid">Pleno</option>
			<option value="junior">Junior</option>
			<option value="intern">Estagiário</option>
		</select>
		{#if errors.jobTitle}<span class="text-error text-sm">{errors.jobTitle}</span>{/if}
	</label>

	{#if showPasswordFields}
		<label class="form-control">
			<span class="label-text">Senha</span>
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
			<span class="label-text">Confirmar senha</span>
			<input
				type="password"
				name="confirmPassword"
				class="input input-bordered w-full"
				autocomplete="new-password"
				required
			/>
			{#if errors.confirmPassword}<span class="text-error text-sm">{errors.confirmPassword}</span
				>{/if}
		</label>
	{/if}
</div>

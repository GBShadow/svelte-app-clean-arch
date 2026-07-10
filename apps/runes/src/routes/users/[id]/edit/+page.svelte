<script lang="ts">
	import { enhance } from '$app/forms';
	import UserForm from '$lib/components/UserForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const updateErrors = $derived(form?.action === 'update' ? (form.errors ?? {}) : {});
	const updateValues = $derived(
		form?.action === 'update' && form.values ? form.values : data.targetUser
	);
	const resetPasswordErrors = $derived(form?.action === 'resetPassword' ? (form.errors ?? {}) : {});
	const resetPasswordSuccess = $derived(form?.action === 'resetPassword' && form.success === true);
</script>

<div class="flex flex-col gap-6 max-w-lg">
	<h1 class="text-2xl font-bold">Editar usuário</h1>

	<form method="POST" action="?/update" class="card bg-base-100 shadow-xl">
		<div class="card-body gap-4">
			<UserForm values={updateValues} canEditEmail={data.canEditEmail} errors={updateErrors} />
			<button type="submit" class="btn btn-primary mt-2">Salvar</button>
		</div>
	</form>

	{#if data.canEditEmail}
		<form method="POST" action="?/resetPassword" use:enhance class="card bg-base-100 shadow-xl">
			<div class="card-body gap-4">
				<h2 class="card-title text-lg">Resetar senha</h2>
				{#if resetPasswordSuccess}
					<div class="alert alert-success" role="status">
						Senha resetada. O usuário precisará trocá-la no próximo login.
					</div>
				{/if}
				{#if resetPasswordErrors.general}
					<div class="alert alert-error" role="alert">{resetPasswordErrors.general}</div>
				{/if}

				<label class="form-control">
					<span class="label-text">Nova senha</span>
					<input
						type="password"
						name="password"
						class="input input-bordered w-full"
						autocomplete="new-password"
						required
					/>
					{#if resetPasswordErrors.password}
						<span class="text-error text-sm">{resetPasswordErrors.password}</span>
					{/if}
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
					{#if resetPasswordErrors.confirmPassword}
						<span class="text-error text-sm">{resetPasswordErrors.confirmPassword}</span>
					{/if}
				</label>

				<button type="submit" class="btn btn-warning mt-2">Resetar senha</button>
			</div>
		</form>

		<form method="POST" action="?/delete" class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title text-lg">Excluir usuário</h2>
				<button type="submit" class="btn btn-error btn-sm w-fit">Excluir</button>
			</div>
		</form>
	{/if}
</div>

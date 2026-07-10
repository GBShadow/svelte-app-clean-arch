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

	<form method="POST" action="?/update" novalidate data-testid="edit-user-form" class="card bg-base-100 shadow-xl">
		<div class="card-body gap-4">
			<UserForm values={updateValues} canEditEmail={data.canEditEmail} errors={updateErrors} testId="user-form-edit" />
			<button type="submit" class="btn btn-primary mt-2" data-testid="btn-save-user">Salvar</button>
		</div>
	</form>

	{#if data.canEditEmail}
		<form method="POST" action="?/resetPassword" novalidate use:enhance class="card bg-base-100 shadow-xl" data-testid="reset-password-form">
			<div class="card-body gap-4">
				<h2 class="card-title text-lg">Resetar senha</h2>
				{#if resetPasswordSuccess}
					<div class="alert alert-success" role="status" data-testid="reset-password-success">
						Senha resetada. O usuário precisará trocá-la no próximo login.
					</div>
				{/if}
				{#if resetPasswordErrors.general}
					<div class="alert alert-error" role="alert" data-testid="error-reset-password">{resetPasswordErrors.general}</div>
				{/if}

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
					{#if resetPasswordErrors.password}
						<span class="text-error text-sm" data-testid="error-password">{resetPasswordErrors.password}</span>
					{/if}
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
					{#if resetPasswordErrors.confirmPassword}
						<span class="text-error text-sm" data-testid="error-confirm-password">{resetPasswordErrors.confirmPassword}</span>
					{/if}
				</label>

				<button type="submit" class="btn btn-warning mt-2" data-testid="btn-reset-password">Resetar senha</button>
			</div>
		</form>

		<form method="POST" action="?/delete" novalidate class="card bg-base-100 shadow-xl" data-testid="delete-user-form">
			<div class="card-body">
				<h2 class="card-title text-lg">Excluir usuário</h2>
				<button type="submit" class="btn btn-error btn-sm w-fit" data-testid="btn-delete-user">Excluir</button>
			</div>
		</form>
	{/if}
</div>

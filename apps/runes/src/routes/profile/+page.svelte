<script lang="ts">
	import Avatar from '$lib/components/Avatar.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<div class="flex flex-col gap-4 max-w-md mx-auto w-full">
	<h1 class="text-2xl font-bold font-display">Meu perfil</h1>

	{#if form?.errors?.general}
		<div class="alert alert-error" role="alert" data-testid="error-general">{form.errors.general}</div>
	{/if}

	<div class="card bg-base-100 border border-base-300 shadow-sm">
		<div class="card-body gap-4 items-center">
			<Avatar
				userId={data.authId}
				avatar={data.user?.avatar ?? ''}
				name={data.user?.name ?? ''}
				size="size-24"
			/>

			<form
				method="POST"
				action="?/uploadAvatar"
				enctype="multipart/form-data"
				novalidate
				class="flex flex-col gap-2 w-full"
				data-testid="avatar-form"
			>
				<input
					type="file"
					name="avatar"
					accept="image/jpeg,image/png,image/webp"
					data-testid="input-avatar"
					class="file-input file-input-bordered w-full"
				/>
				{#if form?.errors?.avatar}
					<span class="text-error text-sm" data-testid="error-avatar">{form.errors.avatar}</span>
				{/if}
				<button type="submit" class="btn btn-primary" data-testid="btn-upload-avatar">Salvar avatar</button>
			</form>
		</div>
	</div>
</div>

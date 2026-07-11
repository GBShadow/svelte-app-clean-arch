<script lang="ts">
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<div class="flex flex-col gap-4 max-w-xl mx-auto w-full">
	<h1 class="text-2xl font-bold font-display">Nova conversa</h1>

	{#if form?.errors?.general}
		<div class="alert alert-error" role="alert" data-testid="error-general">{form.errors.general}</div>
	{/if}

	<form method="POST" novalidate class="flex flex-col gap-4" data-testid="new-room-form">
		<label class="form-control">
			<span class="label-text">Nome da sala (opcional)</span>
			<input type="text" name="name" data-testid="input-room-name" class="input input-bordered w-full" />
		</label>

		<fieldset class="flex flex-col gap-2">
			<legend class="label-text mb-1">Participantes</legend>
			{#if data.users.length === 0}
				<p class="text-sm opacity-60" data-testid="no-users-msg">Nenhum outro usuário disponível.</p>
			{/if}
			{#each data.users as user (user.id)}
				<label class="flex items-center gap-2" data-testid="participant-option-{user.id}">
					<input
						type="checkbox"
						name="participantIds"
						value={user.email}
						class="checkbox"
						data-testid="checkbox-participant-{user.id}"
					/>
					<span>{user.name} <span class="opacity-60 text-sm">({user.email})</span></span>
				</label>
			{/each}
			{#if form?.errors?.participantIds}
				<span class="text-error text-sm" data-testid="error-participant-ids">{form.errors.participantIds}</span>
			{/if}
		</fieldset>

		<button type="submit" class="btn btn-primary w-fit" data-testid="btn-create-room">Criar sala</button>
	</form>
</div>

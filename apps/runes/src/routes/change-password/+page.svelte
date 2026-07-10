<script lang="ts">
	import ChangePasswordForm from '$lib/components/ChangePasswordForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<div class="hero min-h-[60vh]">
	<div class="hero-content w-full max-w-sm flex-col">
		<h1 class="text-3xl font-bold">Troca de senha</h1>
		<p class="text-center text-sm opacity-70">
			{#if data.user}
				{data.user.name}, por segurança você precisa definir uma nova senha.
			{/if}
		</p>

		<ChangePasswordForm errors={form?.errors ?? {}} />
	</div>
</div>

<script lang="ts">
	import { onMount } from 'svelte';
	import AppGrid from '$lib/components/AppGrid.svelte';
	import { appRegistry } from '$lib/appRegistry';
	import { notificationStore } from '$lib/client/notifications.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const user = $derived(data.user);
	const visibleApps = $derived(
		user?.isAdmin ? appRegistry : appRegistry.filter((a) => !a.adminOnly)
	);

	const hasChatUnread = $derived(
		notificationStore.notifications.some(
			(n) => n.type === 'chat' && !n.read
		)
	);

	onMount(() => {
		notificationStore.load({ page: 1 });
	});
</script>

<div class="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] py-8">
	<!-- Saudação -->
	<div class="text-center mb-10 md:mb-14">
		<h1 class="text-3xl md:text-4xl font-display font-bold tracking-tight text-base-content">
			Olá, {user!.name}!
		</h1>
		<p class="mt-2 text-base-content/50 text-lg">
			Selecione um app para começar
		</p>
	</div>

	<!-- Grid de apps -->
	<div class="w-full max-w-5xl">
		<AppGrid apps={visibleApps} hasChatUnread={hasChatUnread} />
	</div>
</div>

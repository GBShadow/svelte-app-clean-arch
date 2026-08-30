<script lang="ts">
	import { onMount } from 'svelte';
	import AppGrid from '$lib/components/AppGrid.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
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

<PageShell width="xl" testId="hub-page">
	<div class="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] py-8 relative">
		<div class="absolute top-12 size-96 rounded-full bg-primary/5 blur-3xl pointer-events-none -z-10"></div>
		
		<!-- Saudação -->
		<div class="text-center mb-10 md:mb-12">
			<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-3 tracking-wide uppercase">
				Painel de Controle
			</div>
			<h1 class="text-3xl md:text-5xl font-display font-extrabold tracking-tight text-base-content">
				Olá, <span class="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{user!.name}</span>!
			</h1>
			<p class="mt-2 text-base-content/60 text-base md:text-lg">
				Selecione um módulo para gerenciar seus projetos e fluxos
			</p>
		</div>

		<!-- Grid de apps -->
		<div class="w-full max-w-5xl">
			<AppGrid apps={visibleApps} hasChatUnread={hasChatUnread} />
		</div>
	</div>
</PageShell>

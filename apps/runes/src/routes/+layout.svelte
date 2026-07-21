<script lang="ts">
	import '../app.css';
	import { onMount, onDestroy } from 'svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { onAuthEvent, postAuthEvent } from '$lib/client/authChannel';
	import IconLogout from '$lib/components/icons/IconLogout.svelte';
	import NotificationBell from '$lib/components/NotificationBell.svelte';
	import { notificationStore } from '$lib/client/notifications.svelte';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	onMount(() => onAuthEvent(() => invalidateAll()));

	if (data.user) {
		const token = (data as any).pbToken;
		const record = (data as any).pbRecord;
		if (token && record) notificationStore.init(data.user.authId, token, record);
	}

	onDestroy(() => notificationStore.destroy());

	async function handleLogout(event: SubmitEvent) {
		event.preventDefault();
		// aguarda o cookie ser limpo no servidor antes de avisar as outras abas,
		// senão elas podem revalidar contra um cookie ainda válido (race condition)
		await fetch('/logout', { method: 'POST' });
		postAuthEvent('logout');
		await goto('/login');
	}
</script>

<div class="min-h-screen bg-base-200">
	<div class="navbar bg-base-100 border-b border-base-300">
		<div class="flex-1">
			<a href="/" class="btn btn-ghost text-xl font-mono normal-case" data-testid="logo-link">
				<span class="text-primary">&#10095;</span> hub
			</a>
		</div>
		<div class="flex-none flex items-center gap-4">
			{#if data.user}
				<span class="text-sm text-base-content/60 hidden sm:block">{data.user.name}</span>
				<NotificationBell />
				<form method="POST" action="/logout" onsubmit={handleLogout}>
					<button type="submit" class="btn btn-ghost btn-sm gap-1.5" data-testid="btn-logout">
						<IconLogout class="size-4" />
						Sair
					</button>
				</form>
			{/if}
		</div>
	</div>

	{#if data.user?.mustChangePassword}
		<div class="alert alert-warning rounded-none justify-center" role="alert" data-testid="alert-change-password">
			Sua senha precisa ser trocada em breve. <a href="/change-password" class="link ml-1">Trocar agora</a>
		</div>
	{/if}

	<main class="container mx-auto p-4">
		{@render children()}
	</main>
</div>

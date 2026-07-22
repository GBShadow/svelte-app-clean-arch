<script lang="ts">
	import '../app.css';
	import { onMount, onDestroy } from 'svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { onAuthEvent, postAuthEvent } from '$lib/client/authChannel';
	import User from 'lucide-svelte/icons/user';
	import IconLogout from '$lib/components/icons/IconLogout.svelte';
	import NotificationBell from '$lib/components/NotificationBell.svelte';
	import { notificationStore } from '$lib/client/notifications.svelte';
	import { accent } from '$lib/client/accent.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	onMount(() => {
		onAuthEvent(() => invalidateAll());
		const a = accent.value;
		document.documentElement.dataset.accent = a;
	});

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

<div class="flex flex-col min-h-dvh bg-base-200">
	<div class="navbar bg-base-100 border-b border-base-300 sticky top-0 z-30">
		<div class="flex-1">
			<a href="/" class="btn btn-ghost text-xl font-mono normal-case" data-testid="logo-link">
				<span class="text-primary">&#10095;</span> hub
			</a>
		</div>
		<div class="flex-none flex items-center gap-4">
			{#if data.user}
				<div class="dropdown dropdown-end hidden sm:block">
					<button type="button" class="btn btn-ghost btn-sm gap-1.5" data-testid="btn-user-menu">
						{data.user.name}
					</button>
					<ul class="dropdown-content z-20 bg-base-100 border border-base-300 rounded-box shadow-lg p-1.5 min-w-40" data-testid="user-dropdown">
						<li>
							<a href="/profile" class="btn btn-ghost btn-sm justify-start gap-2 w-full font-normal" data-testid="btn-profile">
								<User class="size-4" />
								Perfil
							</a>
						</li>
						<li>
							<form method="POST" action="/logout" onsubmit={handleLogout}>
								<button type="submit" class="btn btn-ghost btn-sm justify-start gap-2 w-full font-normal text-error" data-testid="btn-logout">
									<IconLogout class="size-4" />
									Sair
								</button>
							</form>
						</li>
					</ul>
				</div>
				<NotificationBell />
				<form method="POST" action="/logout" onsubmit={handleLogout} class="sm:hidden">
					<button type="submit" class="btn btn-ghost btn-sm gap-1.5" data-testid="btn-logout-mobile">
						<IconLogout class="size-4" />
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

<Toast />

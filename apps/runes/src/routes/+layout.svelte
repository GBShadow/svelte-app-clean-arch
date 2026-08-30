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

<div class="flex flex-col min-h-dvh bg-base-200 selection:bg-primary/30 selection:text-primary-content">
	<div class="navbar surface-glass sticky top-0 z-30 px-4 sm:px-8 transition-all">
		<div class="flex-1">
			<a href="/" class="btn btn-ghost text-xl font-mono normal-case tracking-tight gap-1.5 hover:bg-base-content/10 transition-all rounded-xl" data-testid="logo-link">
				<span class="text-primary font-bold drop-shadow-[0_0_8px_rgba(255,121,198,0.5)]">&#10095;</span>
				<span class="font-display font-semibold tracking-normal text-base-content">hub</span>
			</a>
		</div>
		<div class="flex-none flex items-center gap-2 sm:gap-3">
			{#if data.user}
				<div class="dropdown dropdown-end">
					<button type="button" class="btn btn-ghost btn-sm gap-2 rounded-xl hover:bg-base-content/10 border border-transparent hover:border-base-content/10 transition-all" data-testid="btn-user-menu">
						<div class="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
							{data.user.name ? data.user.name[0].toUpperCase() : 'U'}
						</div>
						<span class="hidden sm:inline font-medium text-sm text-base-content/90">{data.user.name}</span>
					</button>
					<ul class="dropdown-content z-20 surface-glass border border-base-content/15 rounded-2xl shadow-2xl p-2 min-w-48 mt-2 backdrop-blur-2xl" data-testid="user-dropdown">
						<li class="px-3 py-2 border-b border-base-content/10 mb-1">
							<p class="text-xs text-base-content/50 font-medium">Conectado como</p>
							<p class="text-sm font-semibold text-base-content truncate">{data.user.name}</p>
						</li>
						<li>
							<a href="/profile" class="btn btn-ghost btn-sm justify-start gap-2.5 w-full font-normal rounded-lg hover:bg-base-content/10 text-sm" data-testid="btn-profile">
								<User class="size-4 text-primary" />
								Perfil
							</a>
						</li>
						<li>
							<form method="POST" action="/logout" onsubmit={handleLogout}>
								<button type="submit" class="btn btn-ghost btn-sm justify-start gap-2.5 w-full font-normal text-error rounded-lg hover:bg-error/10 text-sm" data-testid="btn-logout">
									<IconLogout class="size-4" />
									Sair
								</button>
							</form>
						</li>
					</ul>
				</div>
				<NotificationBell />
			{/if}
		</div>
	</div>
	{#if data.user?.mustChangePassword}
		<div class="alert alert-warning rounded-none justify-center" role="alert" data-testid="alert-change-password">
			Sua senha precisa ser trocada em breve. <a href="/change-password" class="link ml-1">Trocar agora</a>
		</div>
	{/if}

	<main class="flex-1 w-full min-w-0">
		{@render children()}
	</main>
</div>

<Toast />

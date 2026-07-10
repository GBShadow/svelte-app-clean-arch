<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { onAuthEvent, postAuthEvent } from '$lib/client/authChannel';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	onMount(() => onAuthEvent(() => invalidateAll()));

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
	<div class="navbar bg-base-100 shadow-sm">
		<div class="flex-1">
			<a href="/todos" class="btn btn-ghost text-xl" data-testid="logo-link">Todo Apps</a>
		</div>
		<div class="flex-none flex items-center gap-4">
			{#if data.user}
				<a href="/todos" class="btn btn-ghost btn-sm" data-testid="nav-minhas-listas">Minhas listas</a>
			{/if}
			{#if data.user?.isAdmin}
				<a href="/users" class="btn btn-ghost btn-sm" data-testid="nav-usuarios">Usuários</a>
			{/if}
			{#if data.user}
				<form method="POST" action="/logout" onsubmit={handleLogout}>
					<button type="submit" class="btn btn-ghost btn-sm" data-testid="btn-logout">Sair ({data.user.name})</button>
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

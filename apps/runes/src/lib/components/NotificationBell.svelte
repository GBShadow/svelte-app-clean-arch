<script lang="ts">
	import { onMount } from 'svelte';
	import Bell from 'lucide-svelte/icons/bell';
	import NotificationCenter from './NotificationCenter.svelte';
	import { notificationStore } from '$lib/client/notifications.svelte';

	let open = $state(false);

	function toggle() {
		open = !open;
		if (open) {
			notificationStore.load({ page: 1 });
		}
	}

	function close() {
		open = false;
	}

	function handleOutsideClick(event: MouseEvent) {
		if (open && !(event.target as HTMLElement).closest('[data-notification-bell]')) {
			open = false;
		}
	}

	onMount(() => {
		document.addEventListener('click', handleOutsideClick);
		return () => document.removeEventListener('click', handleOutsideClick);
	});
</script>

<div class="relative" data-notification-bell>
	<button
		type="button"
		class="btn btn-ghost btn-square relative rounded-xl hover:bg-base-content/10 transition-all text-base-content/80 hover:text-base-content"
		onclick={toggle}
		aria-label={`Notificações, {notificationStore.unreadCount} não lidas`}
		aria-expanded={open}
		aria-haspopup="true"
	>
		<Bell class="size-5" />
		{#if notificationStore.unreadCount > 0}
			<span
				class="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-content text-[11px] font-bold shadow-md shadow-primary/30 animate-pulse"
				data-testid="notification-badge"
			>
				{notificationStore.unreadCount > 99 ? '99+' : notificationStore.unreadCount}
			</span>
		{/if}
	</button>

	{#if open}
		<button
			type="button"
			class="fixed inset-0 z-40 bg-transparent"
			onclick={close}
			aria-label="Fechar notificações"
		></button>
		<div class="absolute right-0 top-full z-50 mt-2 w-[min(24rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] max-h-96 surface-glass border border-base-content/15 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl" data-testid="notification-dropdown">
			<NotificationCenter onClose={close} />
		</div>
	{/if}
</div>
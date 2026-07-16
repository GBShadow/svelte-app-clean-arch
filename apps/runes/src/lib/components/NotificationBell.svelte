<script lang="ts">
	import { onMount } from 'svelte';
	import Bell from 'lucide-svelte/icons/bell';
	import NotificationCenter from './NotificationCenter.svelte';
	import { notificationStore } from '$lib/client/notifications.svelte';

	let open = $state(false);
	let pulse = $state(false);

	$effect(() => {
		const count = notificationStore.unreadCount;
		if (count > 0 && !pulse) pulse = true;
	});

	function toggle() {
		open = !open;
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
		class="btn btn-ghost btn-square relative"
		onclick={toggle}
		aria-label={`Notificações, {notificationStore.unreadCount} não lidas`}
		aria-expanded={open}
		aria-haspopup="true"
	>
		<Bell class="size-5" />
		{#if notificationStore.unreadCount > 0}
			<span
				class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-content text-xs font-medium animate-pulse"
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
		<div class="absolute right-0 top-full z-50 mt-2 w-96 max-h-96 bg-base-100 border border-base-300 rounded-box shadow-lg overflow-hidden" data-testid="notification-dropdown">
			<NotificationCenter onClose={close} />
		</div>
	{/if}
</div>
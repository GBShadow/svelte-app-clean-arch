<script lang="ts">
	import { onMount } from 'svelte';
	import BellRing from 'lucide-svelte/icons/bell-ring';
	import { enablePushNotifications, isPushSupported } from '$lib/client/pushSubscription';

	let visible = $state(false);
	let busy = $state(false);

	onMount(() => {
		visible = isPushSupported() && Notification.permission === 'default';
	});

	async function handleEnable() {
		busy = true;
		try {
			const outcome = await enablePushNotifications();
			if (outcome !== 'default') visible = false;
		} finally {
			busy = false;
		}
	}

	function dismiss() {
		visible = false;
	}
</script>

{#if visible}
	<div
		class="alert alert-info flex items-center justify-between gap-3"
		data-testid="notifications-banner"
	>
		<div class="flex items-center gap-2">
			<BellRing class="size-4 shrink-0" />
			<span class="text-sm">Ative notificações para saber quando chegar uma nova mensagem.</span>
		</div>
		<div class="flex items-center gap-2 shrink-0">
			<button
				type="button"
				class="btn btn-sm btn-primary"
				disabled={busy}
				onclick={handleEnable}
				data-testid="btn-banner-enable-notifications"
			>
				Ativar
			</button>
			<button
				type="button"
				class="btn btn-sm btn-ghost"
				onclick={dismiss}
				data-testid="btn-banner-dismiss"
			>
				Agora não
			</button>
		</div>
	</div>
{/if}

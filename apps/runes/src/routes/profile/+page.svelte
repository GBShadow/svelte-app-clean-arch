<script lang="ts">
	import { onMount } from 'svelte';
	import Bell from 'lucide-svelte/icons/bell';
	import BellOff from 'lucide-svelte/icons/bell-off';
	import Avatar from '$lib/components/Avatar.svelte';
	import type { PageProps } from './$types';
	import {
		disablePushNotifications,
		enablePushNotifications,
		hasActiveSubscription,
		isPushSupported
	} from '$lib/client/pushSubscription';

	let { data, form }: PageProps = $props();

	type NotificationState = 'loading' | 'unsupported' | 'default' | 'denied' | 'subscribed';

	let notificationState = $state<NotificationState>('loading');
	let notificationBusy = $state(false);
	let notificationError = $state('');

	async function refreshNotificationState() {
		if (!isPushSupported()) {
			notificationState = 'unsupported';
			return;
		}
		if (Notification.permission === 'denied') {
			notificationState = 'denied';
			return;
		}
		if (Notification.permission === 'granted' && (await hasActiveSubscription())) {
			notificationState = 'subscribed';
			return;
		}
		notificationState = 'default';
	}

	onMount(() => {
		refreshNotificationState();
	});

	async function handleEnable() {
		notificationBusy = true;
		notificationError = '';
		try {
			const outcome = await enablePushNotifications();
			if (outcome === 'granted') notificationState = 'subscribed';
			else if (outcome === 'denied') notificationState = 'denied';
			else if (outcome === 'unsupported') notificationState = 'unsupported';
		} catch {
			notificationError = 'Não foi possível ativar as notificações.';
		} finally {
			notificationBusy = false;
		}
	}

	async function handleDisable() {
		notificationBusy = true;
		notificationError = '';
		try {
			await disablePushNotifications();
			notificationState = 'default';
		} catch {
			notificationError = 'Não foi possível desativar as notificações.';
		} finally {
			notificationBusy = false;
		}
	}
</script>

<div class="flex flex-col gap-4 max-w-md mx-auto w-full">
	<h1 class="text-2xl font-bold font-display">Meu perfil</h1>

	{#if form?.errors?.general}
		<div class="alert alert-error" role="alert" data-testid="error-general">{form.errors.general}</div>
	{/if}

	<div class="card bg-base-100 border border-base-300 shadow-sm">
		<div class="card-body gap-4 items-center">
			<Avatar
				userId={data.authId}
				avatar={data.user?.avatar ?? ''}
				name={data.user?.name ?? ''}
				size="size-24"
			/>

			<form
				method="POST"
				action="?/uploadAvatar"
				enctype="multipart/form-data"
				novalidate
				class="flex flex-col gap-2 w-full"
				data-testid="avatar-form"
			>
				<input
					type="file"
					name="avatar"
					accept="image/jpeg,image/png,image/webp"
					data-testid="input-avatar"
					class="file-input file-input-bordered w-full"
				/>
				{#if form?.errors?.avatar}
					<span class="text-error text-sm" data-testid="error-avatar">{form.errors.avatar}</span>
				{/if}
				<button type="submit" class="btn btn-primary" data-testid="btn-upload-avatar">Salvar avatar</button>
			</form>
		</div>
	</div>

	<div class="card bg-base-100 border border-base-300 shadow-sm">
		<div class="card-body gap-3">
			<h2 class="card-title text-base">Notificações push</h2>

			{#if notificationError}
				<div class="alert alert-error" role="alert" data-testid="error-notifications">
					{notificationError}
				</div>
			{/if}

			{#if notificationState === 'loading'}
				<p class="text-sm opacity-60">Verificando suporte...</p>
			{:else if notificationState === 'unsupported'}
				<p class="text-sm opacity-60" data-testid="notifications-unsupported">
					Este navegador não é compatível com notificações push.
				</p>
			{:else if notificationState === 'denied'}
				<p class="text-sm opacity-80" data-testid="notifications-blocked">
					As notificações estão bloqueadas nas configurações do navegador. Para ativar,
					permita notificações para este site manualmente nas configurações do navegador.
				</p>
			{:else if notificationState === 'subscribed'}
				<p class="text-sm opacity-70">Notificações ativas neste dispositivo.</p>
				<button
					type="button"
					class="btn btn-outline btn-sm gap-1.5 w-fit"
					disabled={notificationBusy}
					onclick={handleDisable}
					data-testid="btn-disable-notifications"
				>
					<BellOff class="size-4" />
					Desativar notificações
				</button>
			{:else}
				<p class="text-sm opacity-70">Receba um alerta quando chegar uma nova mensagem.</p>
				<button
					type="button"
					class="btn btn-primary btn-sm gap-1.5 w-fit"
					disabled={notificationBusy}
					onclick={handleEnable}
					data-testid="btn-enable-notifications"
				>
					<Bell class="size-4" />
					Ativar notificações
				</button>
			{/if}
		</div>
	</div>
</div>

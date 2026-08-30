<script lang="ts">
	import { onMount } from 'svelte';
	import Bell from 'lucide-svelte/icons/bell';
	import BellOff from 'lucide-svelte/icons/bell-off';
	import Avatar from '$lib/components/Avatar.svelte';
	import type { PageProps } from './$types';
	import AccentPicker from '$lib/components/AccentPicker.svelte';
	import {
		disablePushNotifications,
		enablePushNotifications,
		hasActiveSubscription,
		isPushSupported
	} from '$lib/client/pushSubscription';

import PageShell from '$lib/components/PageShell.svelte';

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

<PageShell width="sm" testId="profile-page">
	<div class="space-y-6">
		<div class="border-b border-base-content/10 pb-4">
			<h1 class="text-2xl sm:text-3xl font-bold font-display tracking-tight text-base-content">Meu perfil</h1>
			<p class="text-sm text-base-content/60 mt-1">Gerencie seu avatar, notificações e preferências de tema</p>
		</div>

		{#if form?.errors?.general}
			<div class="alert alert-error surface-glass border-error/30 text-error-content rounded-2xl shadow-lg" role="alert" data-testid="error-general">{form.errors.general}</div>
		{/if}

		<div class="surface-card rounded-2xl p-6">
			<div class="flex flex-col gap-5 items-center">
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
					class="flex flex-col gap-3 w-full"
					data-testid="avatar-form"
				>
					<input
						type="file"
						name="avatar"
						accept="image/jpeg,image/png,image/webp"
						data-testid="input-avatar"
						class="file-input file-input-bordered w-full rounded-xl bg-base-100/70 border-base-content/15 focus:border-primary text-sm"
					/>
					{#if form?.errors?.avatar}
						<span class="text-error text-xs font-medium" data-testid="error-avatar">{form.errors.avatar}</span>
					{/if}
					<button type="submit" class="btn btn-primary rounded-xl font-semibold shadow-md shadow-primary/20 hover:shadow-lg transition-all" data-testid="btn-upload-avatar">Salvar avatar</button>
				</form>
			</div>
		</div>

		<div class="surface-card rounded-2xl p-6">
			<div class="space-y-3">
				<h2 class="text-base font-display font-bold text-base-content">Notificações push</h2>

				{#if notificationError}
					<div class="alert alert-error surface-glass text-xs rounded-xl" role="alert" data-testid="error-notifications">
						{notificationError}
					</div>
				{/if}

				{#if notificationState === 'loading'}
					<p class="text-sm text-base-content/50">Verificando suporte...</p>
				{:else if notificationState === 'unsupported'}
					<p class="text-sm text-base-content/50" data-testid="notifications-unsupported">
						Este navegador não é compatível com notificações push.
					</p>
				{:else if notificationState === 'denied'}
					<p class="text-sm text-base-content/70" data-testid="notifications-blocked">
						As notificações estão bloqueadas nas configurações do navegador. Para ativar,
						permita notificações para este site manualmente nas configurações do navegador.
					</p>
				{:else if notificationState === 'subscribed'}
					<p class="text-sm text-base-content/70">Notificações ativas neste dispositivo.</p>
					<button
						type="button"
						class="btn btn-outline btn-sm gap-2 rounded-xl"
						disabled={notificationBusy}
						onclick={handleDisable}
						data-testid="btn-disable-notifications"
					>
						<BellOff class="size-4" />
						Desativar notificações
					</button>
				{:else}
					<p class="text-sm text-base-content/70">Receba um alerta quando chegar uma nova mensagem.</p>
					<button
						type="button"
						class="btn btn-primary btn-sm gap-2 rounded-xl font-medium shadow-sm"
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

		<div class="surface-card rounded-2xl p-6">
			<div class="space-y-3">
				<h2 class="text-base font-display font-bold text-base-content">Acentuar</h2>
				<p class="text-sm text-base-content/60">Escolha a paleta de cores da aplicação.</p>
				<AccentPicker />
			</div>
		</div>
	</div>
</PageShell>

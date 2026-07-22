<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { enhance } from '$app/forms';
	import { createBrowserClient } from '$lib/client/pocketbaseClient';
	import { ChatMessagesFeed } from '$lib/domain/ChatMessagesFeed.svelte';
	import { notificationStore } from '$lib/client/notifications.svelte';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import ArrowDown from 'lucide-svelte/icons/arrow-down';
	import Users from 'lucide-svelte/icons/users';
	import Avatar from '$lib/components/Avatar.svelte';
	import IconTrash from '$lib/components/icons/IconTrash.svelte';
	import type { ChatMessageRecord } from '$lib/server/chatRecord';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let inputEl: HTMLInputElement | undefined = $state();
	let messagesEl: HTMLDivElement | undefined = $state();
	let isNearBottom = $state(true);
	let showParticipants = $state(false);

	onMount(() => {
		if (data.pbToken && data.pbRecord) {
			notificationStore.init(data.userId, data.pbToken, data.pbRecord);
			const unreadIds = notificationStore.notifications
				.filter((n) => n.type === 'chat' && !n.read && n.metadata?.roomId === data.room.id)
				.map((n) => n.id);
			if (unreadIds.length > 0) {
				notificationStore.markAsRead(unreadIds);
			}
		}
	});

	onDestroy(() => {
		notificationStore.destroy();
	});

	const feed = new ChatMessagesFeed(data.room.id, data.messages, (roomId, onMessage) => {
		const pb = createBrowserClient(data.pbToken, data.pbRecord);
		let stopped = false;

		pb.collection('chat_messages')
			.subscribe<ChatMessageRecord>(
				'*',
				(event) => {
					if (event.action === 'create') {
						onMessage(event.record);
						notificationStore.suppressChatNotification(event.record.room);
					}
				},
				{ filter: `room = "${roomId}"` }
			)
			.catch((err) => console.error('[chat] Falha ao inscrever no realtime da sala:', err));

		return () => {
			if (stopped) return;
			stopped = true;
			pb.collection('chat_messages').unsubscribe('*');
		};
	});

	$effect(() => {
		feed.sync(data.messages);
	});

	onMount(() => feed.start());
	onDestroy(() => feed.stop());

	$effect(() => {
		const msgs = feed.messages;
		if (msgs.length > 0 && isNearBottom) {
			tick().then(() => {
				if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
			});
		}
	});

	function handleScroll() {
		if (!messagesEl) return;
		const threshold = 100;
		isNearBottom = messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight < threshold;
	}

	function scrollToBottom() {
		if (!messagesEl) return;
		messagesEl.scrollTo({ top: messagesEl.scrollHeight, behavior: 'smooth' });
		isNearBottom = true;
	}

	const otherParticipants = $derived(
		(data.room.expand?.participants ?? []).filter((p) => p.id !== data.userId)
	);
	const isRoomCreator = $derived(data.room.created_by === data.userId);
	const participantsById = $derived(
		new Map(
			[...(data.room.expand?.participants ?? []), ...(data.orphanSenders ?? [])].map((p) => [
				p.id,
				p
			])
		)
	);
</script>

<div class="flex flex-col mx-auto w-full h-[calc(100dvh_-_6rem)]">
	<div class="flex flex-1 min-h-0 justify-center">
		<div class="flex flex-col flex-1 min-h-0 gap-4" class:max-w-5xl={showParticipants} class:max-w-2xl={!showParticipants}>
			<div class="flex items-center gap-2 shrink-0">
				<a href="/chat" class="btn btn-ghost btn-sm btn-square shrink-0 tooltip tooltip-right" data-testid="btn-back-to-chat" data-tip="Voltar" aria-label="Voltar">
					<ArrowLeft class="size-5" />
				</a>
				<h1 class="text-2xl font-bold font-display flex-1 min-w-0 truncate" data-testid="room-title">
					{data.room.name || otherParticipants.map((p) => p.name).join(', ')}
				</h1>
				<button
					type="button"
					class="btn btn-ghost btn-sm gap-1.5"
					class:btn-soft={showParticipants}
					onclick={() => showParticipants = !showParticipants}
					data-testid="btn-toggle-participants"
				>
					<Users class="size-4" />
					Participantes
				</button>
				<form method="POST" action="?/leaveRoom" data-testid="leave-room-form">
					<button type="submit" class="btn btn-outline btn-sm text-error hover:bg-error/10 border-error" data-testid="btn-leave-room">Sair da sala</button>
				</form>
			</div>

			{#if form?.errors?.general}
				<div class="alert alert-error shrink-0" role="alert" data-testid="error-chat">{form.errors.general}</div>
			{/if}

			<div class="flex flex-1 min-h-0 gap-4">
				<div class="flex flex-col flex-1 min-h-0 gap-4 min-w-0">
					<div
						class="card bg-base-100 border border-base-300 shadow-sm flex-1 min-h-0 overflow-y-auto relative"
						data-testid="chat-messages-card"
						bind:this={messagesEl}
						onscroll={handleScroll}
					>
						<div class="card-body gap-2">
							{#each feed.messages as message (message.id)}
								{@const sender = participantsById.get(message.sender)}
								<div class="flex items-start gap-2" data-testid="chat-message-{message.id}">
									<Avatar
										userId={message.sender}
										avatar={sender?.avatar ?? ''}
										name={sender?.name ?? ''}
										size="size-6"
									/>
									<div>
										<p class="text-xs opacity-60">{sender?.name ?? ''}</p>
										<p data-testid="chat-message-text-{message.id}">{message.text}</p>
									</div>
								</div>
							{/each}
						</div>

						{#if !isNearBottom}
							<button
								type="button"
								class="btn btn-circle btn-sm btn-soft btn-primary absolute bottom-4 right-4 shadow-lg z-10"
								onclick={scrollToBottom}
								data-testid="btn-scroll-bottom"
								aria-label="Ir para a mensagem mais recente"
							>
								<ArrowDown class="size-4" />
							</button>
						{/if}
					</div>

					<form
						method="POST"
						action="?/sendMessage"
						novalidate
						class="flex flex-col gap-2 shrink-0"
						data-testid="send-message-form"
						use:enhance={() => {
							return async ({ update }) => {
								await update({ reset: true });
								tick().then(() => inputEl?.focus());
							};
						}}
					>
						<div class="flex gap-2">
							<input
								type="text"
								name="text"
								placeholder="Escreva uma mensagem..."
								data-testid="input-message"
								class="input input-bordered flex-1"
								required
								bind:this={inputEl}
							/>
							<button type="submit" class="btn btn-primary" data-testid="btn-send-message">Enviar</button>
						</div>
						{#if form?.errors?.text}
							<span class="text-error text-sm" data-testid="error-message-text">{form.errors.text}</span>
						{/if}
					</form>
				</div>

				{#if showParticipants}
					<div class="w-72 shrink-0 self-start card bg-base-100 border border-base-300 shadow-sm">
						<div class="card-body gap-3">
							<p class="font-medium text-sm">Participantes</p>
							<ul class="flex flex-col gap-1">
								{#each otherParticipants as p (p.id)}
									<li class="flex items-center justify-between gap-2" data-testid="participant-row-{p.id}">
										<span class="flex items-center gap-2 min-w-0">
											<Avatar userId={p.id} avatar={p.avatar} name={p.name} size="size-6" />
											<span class="truncate text-sm">{p.name}</span>
										</span>
										{#if isRoomCreator}
											<form method="POST" action="?/removeParticipant">
												<input type="hidden" name="userId" value={p.id} />
												<button type="submit" class="btn btn-ghost btn-xs text-error hover:bg-error/10" data-testid="btn-remove-participant-{p.id}">
													<IconTrash class="size-3.5" />
												</button>
											</form>
										{/if}
									</li>
								{/each}
							</ul>
							{#if isRoomCreator}
								<form method="POST" action="?/addParticipant" novalidate class="flex flex-col gap-2" data-testid="add-participant-form">
									<div class="flex gap-2">
										<input
											type="email"
											name="email"
											placeholder="E-mail"
											data-testid="input-add-participant"
											class="input input-bordered input-sm flex-1"
										/>
										<button type="submit" class="btn btn-sm" data-testid="btn-add-participant">Adicionar</button>
									</div>
									{#if form?.errors?.email}
										<span class="text-error text-sm" data-testid="error-add-participant-email">{form.errors.email}</span>
									{/if}
								</form>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { enhance } from '$app/forms';
	import { createBrowserClient } from '$lib/client/pocketbaseClient';
	import { ChatMessagesFeed } from '$lib/domain/ChatMessagesFeed.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import IconTrash from '$lib/components/icons/IconTrash.svelte';
	import type { ChatMessageRecord } from '$lib/server/chatRecord';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const feed = new ChatMessagesFeed(data.room.id, data.messages, (roomId, onMessage) => {
		const pb = createBrowserClient(data.pbToken, data.pbRecord);
		let stopped = false;

		pb.collection('chat_messages')
			.subscribe<ChatMessageRecord>(
				'*',
				(event) => {
					if (event.action === 'create') onMessage(event.record);
				},
				{ filter: `room = "${roomId}"`, expand: 'sender' }
			)
			.catch(() => {});

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

	const otherParticipants = $derived(
		(data.room.expand?.participants ?? []).filter((p) => p.id !== data.userId)
	);
	const isRoomCreator = $derived(data.room.created_by === data.userId);
</script>

<div class="flex flex-col gap-4 max-w-2xl mx-auto w-full">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold font-display" data-testid="room-title">
			{data.room.name || otherParticipants.map((p) => p.name).join(', ')}
		</h1>
		<form method="POST" action="?/leaveRoom" data-testid="leave-room-form">
			<button type="submit" class="btn btn-outline btn-sm" data-testid="btn-leave-room">Sair da sala</button>
		</form>
	</div>

	{#if form?.errors?.general}
		<div class="alert alert-error" role="alert" data-testid="error-chat">{form.errors.general}</div>
	{/if}

	{#if isRoomCreator}
		<div class="card bg-base-100 border border-base-300 shadow-sm">
			<div class="card-body gap-2">
				<p class="font-medium text-sm">Participantes</p>
				<ul class="flex flex-col gap-1">
					{#each otherParticipants as p (p.id)}
						<li class="flex items-center justify-between gap-2" data-testid="participant-row-{p.id}">
							<span class="flex items-center gap-2">
								<Avatar userId={p.id} avatar={p.avatar} name={p.name} size="size-6" />
								{p.name}
							</span>
							<form method="POST" action="?/removeParticipant">
								<input type="hidden" name="userId" value={p.id} />
								<button type="submit" class="btn btn-ghost btn-xs" data-testid="btn-remove-participant-{p.id}">
									<IconTrash class="size-3.5" />
								</button>
							</form>
						</li>
					{/each}
				</ul>
				<form method="POST" action="?/addParticipant" novalidate class="flex gap-2" data-testid="add-participant-form">
					<input
						type="email"
						name="email"
						placeholder="E-mail do participante"
						data-testid="input-add-participant"
						class="input input-bordered input-sm flex-1"
					/>
					<button type="submit" class="btn btn-sm" data-testid="btn-add-participant">Adicionar</button>
				</form>
			</div>
		</div>
	{/if}

	<div class="card bg-base-100 border border-base-300 shadow-sm flex-1" data-testid="chat-messages-card">
		<div class="card-body gap-2">
			{#each feed.messages as message (message.id)}
				<div class="flex items-start gap-2" data-testid="chat-message-{message.id}">
					<Avatar
						userId={message.sender}
						avatar={message.expand?.sender?.avatar ?? ''}
						name={message.expand?.sender?.name ?? ''}
						size="size-6"
					/>
					<div>
						<p class="text-xs opacity-60">{message.expand?.sender?.name}</p>
						<p data-testid="chat-message-text-{message.id}">{message.text}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<form
		method="POST"
		action="?/sendMessage"
		novalidate
		class="flex gap-2"
		data-testid="send-message-form"
		use:enhance={() => {
			return async ({ update }) => {
				await update({ reset: true });
			};
		}}
	>
		<input
			type="text"
			name="text"
			placeholder="Escreva uma mensagem..."
			data-testid="input-message"
			class="input input-bordered flex-1"
			required
		/>
		<button type="submit" class="btn btn-primary" data-testid="btn-send-message">Enviar</button>
	</form>
</div>

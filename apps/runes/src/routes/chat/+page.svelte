<script lang="ts">
	import Avatar from '$lib/components/Avatar.svelte';
	import IconPlus from '$lib/components/icons/IconPlus.svelte';
	import type { ChatRoomRecord } from '$lib/server/chatRecord';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	function otherParticipants(room: ChatRoomRecord) {
		return (room.expand?.participants ?? []).filter((p) => p.id !== data.userId);
	}

	function roomDisplayName(room: ChatRoomRecord): string {
		if (room.name) return room.name;
		const others = otherParticipants(room);
		return others.map((p) => p.name).join(', ') || 'Sala';
	}
</script>

<div class="flex flex-col gap-4 mx-auto w-full max-w-2xl">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold font-display">Chat</h1>
		<a href="/chat/new" class="btn btn-primary btn-sm gap-1.5" data-testid="btn-new-room">
			<IconPlus class="size-4" />
			Nova conversa
		</a>
	</div>

	{#if data.rooms.length === 0}
		<div class="empty-state">
			<div class="card-body">
				<p class="font-mono text-sm opacity-80" data-testid="no-rooms-msg">
					Ainda sem conversas. Crie a primeira acima.
				</p>
			</div>
		</div>
	{:else}
		<ul class="flex flex-col gap-2">
			{#each data.rooms as { room, lastMessage } (room.id)}
				{@const participant = otherParticipants(room)[0]}
				<li class="card bg-base-100 border border-base-300 shadow-sm" data-testid="room-item-{room.id}">
					<a href="/chat/{room.id}" class="card-body flex-row items-center gap-3 py-3" data-testid="room-link-{room.id}">
						{#if participant}
							<Avatar userId={participant.id} avatar={participant.avatar} name={participant.name} />
						{/if}
						<div class="flex-1 min-w-0">
							<p class="font-medium truncate">{roomDisplayName(room)}</p>
							{#if lastMessage}
								<p class="text-sm opacity-60 truncate" data-testid="room-preview-{room.id}">{lastMessage.text}</p>
							{/if}
						</div>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<script lang="ts">
	import AppCard from './AppCard.svelte';
	import type { AppEntry } from '$lib/appRegistry';

	let {
		apps,
		hasChatUnread = false
	}: {
		apps: AppEntry[];
		hasChatUnread?: boolean;
	} = $props();
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
	{#each apps as app (app.id)}
		<AppCard
			icon={app.icon}
			name={app.name}
			description={app.description}
			href={app.route}
			pulseDot={app.id === 'chat' && hasChatUnread}
		/>
	{/each}
</div>

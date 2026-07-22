<script lang="ts">
	import CircleCheck from 'lucide-svelte/icons/circle-check';
	import CircleX from 'lucide-svelte/icons/circle-x';
	import X from 'lucide-svelte/icons/x';
	import { toastStore } from '$lib/client/toast.svelte';

	let items = $derived(toastStore.items);
</script>

{#if items.length > 0}
	<div class="toast toast-end toast-bottom z-50 gap-2">
		{#each items as toast (toast.id)}
			<div
				class="alert {toast.type === 'success' ? 'alert-success' : 'alert-error'} shadow-lg flex items-center gap-2 pr-2"
				role="alert"
			>
				{#if toast.type === 'success'}
					<CircleCheck class="size-5 shrink-0" />
				{:else}
					<CircleX class="size-5 shrink-0" />
				{/if}
				<span class="text-sm">{toast.message}</span>
				<button class="btn btn-ghost btn-xs btn-square shrink-0" onclick={() => toastStore.remove(toast.id)}>
					<X class="size-4" />
				</button>
			</div>
		{/each}
	</div>
{/if}

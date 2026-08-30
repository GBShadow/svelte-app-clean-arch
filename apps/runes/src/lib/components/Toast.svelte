<script lang="ts">
	import CircleCheck from 'lucide-svelte/icons/circle-check';
	import CircleX from 'lucide-svelte/icons/circle-x';
	import X from 'lucide-svelte/icons/x';
	import { toastStore } from '$lib/client/toast.svelte';

	let items = $derived(toastStore.items);
</script>

{#if items.length > 0}
	<div class="toast toast-end toast-bottom z-50 gap-2.5 p-4">
		{#each items as toast (toast.id)}
			<div
				class="surface-glass rounded-2xl shadow-2xl border flex items-center gap-3 p-3.5 pr-2.5 backdrop-blur-2xl transition-all animate-in slide-in-from-bottom-5 duration-200 {toast.type === 'success' ? 'border-success/30 bg-success/10 text-success-content' : 'border-error/30 bg-error/10 text-error-content'}"
				role="alert"
			>
				{#if toast.type === 'success'}
					<div class="size-8 rounded-xl bg-success/20 text-success flex items-center justify-center shrink-0">
						<CircleCheck class="size-4.5" />
					</div>
				{:else}
					<div class="size-8 rounded-xl bg-error/20 text-error flex items-center justify-center shrink-0">
						<CircleX class="size-4.5" />
					</div>
				{/if}
				<span class="text-sm font-medium text-base-content max-w-xs">{toast.message}</span>
				<button
					class="btn btn-ghost btn-xs btn-square shrink-0 rounded-lg hover:bg-base-content/10 transition-colors"
					onclick={() => toastStore.remove(toast.id)}
					aria-label="Fechar notificação"
				>
					<X class="size-4 text-base-content/50 hover:text-base-content" />
				</button>
			</div>
		{/each}
	</div>
{/if}

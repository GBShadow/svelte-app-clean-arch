import { toastStore } from './toast.svelte';

interface ToastEnhanceOptions {
	successMessage?: string;
	noSuccessToast?: boolean;
}

export function withToast(opts?: ToastEnhanceOptions) {
	return () => {
		return async ({ result, update }: any) => {
			if (result.type === 'failure') {
				const data = result.data as Record<string, unknown>;
				const msg =
					(typeof data?.error === 'string' ? data.error :
					typeof (data?.errors as any)?.general === 'string' ? (data.errors as any).general :
					null) || 'Erro ao executar ação.';
				toastStore.add(msg, 'error');
			} else if ((result.type === 'success' || result.type === 'redirect') && opts?.successMessage && !opts?.noSuccessToast) {
				toastStore.add(opts.successMessage, 'success');
			}
			await update();
		};
	};
}

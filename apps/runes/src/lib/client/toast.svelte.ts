export type ToastType = 'success' | 'error';

export interface Toast {
	id: string;
	message: string;
	type: ToastType;
}

class ToastStore {
	items = $state<Toast[]>([]);

	add(message: string, type: ToastType) {
		const id = crypto.randomUUID();
		this.items = [...this.items, { id, message, type }];
		setTimeout(() => this.remove(id), 4000);
	}

	remove(id: string) {
		this.items = this.items.filter((t) => t.id !== id);
	}
}

export const toastStore = new ToastStore();

import { browser } from '$app/environment';

const STORAGE_KEY = 'accent';

class AccentStore {
	value = $state('magenta');

	constructor() {
		if (browser) {
			this.value = localStorage.getItem(STORAGE_KEY) || 'magenta';
		}
	}

	set(name: string) {
		this.value = name;
		if (browser) {
			localStorage.setItem(STORAGE_KEY, name);
			document.documentElement.dataset.accent = name;
		}
	}
}

export const accent = new AccentStore();

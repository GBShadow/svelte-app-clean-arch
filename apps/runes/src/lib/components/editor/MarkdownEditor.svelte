<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	let {
		value = $bindable(''),
		readonly = false,
		fullHeight = false,
		theme = $bindable<'dark' | 'light'>('dark'),
		dataTestid = 'markdown-editor'
	}: {
		value?: string;
		readonly?: boolean;
		fullHeight?: boolean;
		theme?: 'dark' | 'light';
		dataTestid?: string;
	} = $props();

	let element: HTMLDivElement | undefined = $state();
	let crepe: import('@milkdown/crepe').Crepe | undefined = $state();
	let syncing = false;
	let themeStyleEl: HTMLStyleElement | null = null;
	let mountingTheme: 'dark' | 'light' | null = null;

	const LIGHT_CSS = String.raw`
.milkdown {
  --crepe-color-background: #ffffff;
  --crepe-color-on-background: #000000;
  --crepe-color-surface: #f7f7f7;
  --crepe-color-surface-low: #ededed;
  --crepe-color-on-surface: #1c1c1c;
  --crepe-color-on-surface-variant: #4d4d4d;
  --crepe-color-outline: #a8a8a8;
  --crepe-color-primary: #333333;
  --crepe-color-secondary: #cfcfcf;
  --crepe-color-on-secondary: #000000;
  --crepe-color-inverse: #f0f0f0;
  --crepe-color-on-inverse: #1a1a1a;
  --crepe-color-inline-code: #ba1a1a;
  --crepe-color-error: #ba1a1a;
  --crepe-color-hover: #e0e0e0;
  --crepe-color-selected: #d5d5d5;
  --crepe-color-inline-area: #cacaca;
  --crepe-font-title: 'Noto Serif', Cambria, 'Times New Roman', Times, serif;
  --crepe-font-default: 'Noto Sans', Arial, Helvetica, sans-serif;
  --crepe-font-code: 'Space Mono', Fira Code, Menlo, Monaco, 'Courier New', Courier, monospace;
  --crepe-shadow-1: 0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3);
  --crepe-shadow-2: 0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3);
}`;

	const DARK_CSS = String.raw`
.milkdown {
  --crepe-color-background: #1a1a1a;
  --crepe-color-on-background: #e6e6e6;
  --crepe-color-surface: #121212;
  --crepe-color-surface-low: #1c1c1c;
  --crepe-color-on-surface: #d1d1d1;
  --crepe-color-on-surface-variant: #a9a9a9;
  --crepe-color-outline: #757575;
  --crepe-color-primary: #b5b5b5;
  --crepe-color-secondary: #4d4d4d;
  --crepe-color-on-secondary: #d6d6d6;
  --crepe-color-inverse: #e5e5e5;
  --crepe-color-on-inverse: #2a2a2a;
  --crepe-color-inline-code: #ff6666;
  --crepe-color-error: #ff6666;
  --crepe-color-hover: #232323;
  --crepe-color-selected: #2f2f2f;
  --crepe-color-inline-area: #2b2b2b;
  --crepe-font-title: 'Noto Serif', Cambria, 'Times New Roman', Times, serif;
  --crepe-font-default: 'Noto Sans', Arial, Helvetica, sans-serif;
  --crepe-font-code: 'Space Mono', Fira Code, Menlo, Monaco, 'Courier New', Courier, monospace;
  --crepe-shadow-1: 0px 1px 2px 0px rgba(255, 255, 255, 0.3), 0px 1px 3px 1px rgba(255, 255, 255, 0.15);
  --crepe-shadow-2: 0px 1px 2px 0px rgba(255, 255, 255, 0.3), 0px 2px 6px 2px rgba(255, 255, 255, 0.15);
}`;

	function applyThemeCSS(dark: boolean) {
		if (themeStyleEl) themeStyleEl.remove();
		themeStyleEl = document.createElement('style');
		themeStyleEl.textContent = dark ? DARK_CSS : LIGHT_CSS;
		document.head.appendChild(themeStyleEl);
	}

	async function createCrepe(md: string) {
		if (!browser || !element) return;

		const { Crepe } = await import('@milkdown/crepe');

		applyThemeCSS(theme === 'dark');

		const instance = new Crepe({
			root: element,
			defaultValue: md
		});

		if (!readonly) {
			instance.on((listener) => {
				listener.markdownUpdated((_ctx, markdown) => {
					if (syncing) return;
					value = markdown;
				});
			});
		}

		await instance.create();

		if (readonly) {
			instance.setReadonly(true);
		}

		crepe = instance;
		mountingTheme = null;
	}

	async function destroyCrepe() {
		await crepe?.destroy();
		crepe = undefined;
	}

	onMount(async () => {
		if (!browser || !element) return;
		await import('@milkdown/crepe/theme/common/style.css');
		await createCrepe(value);
	});

	onDestroy(async () => {
		await destroyCrepe();
		if (themeStyleEl) themeStyleEl.remove();
	});

	$effect(() => {
		if (!crepe) return;
		const currentMarkdown = crepe.getMarkdown();
		if (value !== currentMarkdown) {
			syncing = true;
			import('@milkdown/kit/utils').then(({ replaceAll }) => {
				crepe?.editor.action(replaceAll(value));
				syncing = false;
			});
		}
	});

	$effect(() => {
		if (!mountingTheme && theme && crepe) {
			mountingTheme = theme;
			return;
		}
		if (!crepe) return;
		const currentMd = crepe.getMarkdown();
		destroyCrepe().then(() => createCrepe(currentMd));
	});
</script>

<div class="milkdown-editor-wrapper {fullHeight ? 'full-height' : ''}" data-testid={dataTestid}>
	<div
		bind:this={element}
		class="milkdown-editor-root"
	></div>
</div>

<style>
	:global(.milkdown-editor-wrapper) {
		display: flex;
		flex-direction: column;
	}

	:global(.milkdown-editor-wrapper.full-height) {
		height: 100%;
		min-height: 0;
	}

	:global(.milkdown-editor-root) {
		border: 1px solid oklch(0.87 0 0);
		border-radius: 0.5rem;
		overflow: hidden;
		flex: 1 1 auto;
		min-height: 0;
		display: flex;
		flex-direction: column;
	}

	:global(.milkdown-editor-wrapper.full-height .milkdown-editor-root) {
		border-radius: 0;
		border: none;
	}

	:global(.milkdown-editor-root .milkdown-menu-wrapper) {
		border-bottom: 1px solid oklch(0.87 0 0);
		background: oklch(0.97 0 0);
		flex-shrink: 0;
	}

	:global(.milkdown-editor-root .editor) {
		min-height: 120px;
		padding: 0.75rem;
		flex: 1 1 auto;
		overflow-y: auto;
	}

	:global(.milkdown-editor-wrapper.full-height .milkdown-editor-root .editor) {
		min-height: 0;
	}
</style>

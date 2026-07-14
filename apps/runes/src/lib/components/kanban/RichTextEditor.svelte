<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import { TaskList, TaskItem } from '@tiptap/extension-list';
	import ListTodo from 'lucide-svelte/icons/list-todo';

	let { value = $bindable(''), placeholder = 'Descrição da tarefa...' } = $props();

	let element: HTMLDivElement | undefined = $state();
	let editor: Editor | undefined = $state();

	onMount(() => {
		if (!element) return;
		editor = new Editor({
			element,
			extensions: [StarterKit, TaskList, TaskItem.configure({ nested: true })],
			content: value,
			onUpdate: ({ editor }) => {
				value = editor.getHTML();
			}
		});
	});

	onDestroy(() => {
		editor?.destroy();
	});

	$effect(() => {
		if (editor && value !== editor.getHTML()) {
			editor.commands.setContent(value);
		}
	});
</script>

<div class="flex flex-col border border-base-300 rounded-lg overflow-hidden bg-base-50 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
	{#if editor}
		<div class="flex items-center gap-1 p-1 bg-base-200 border-b border-base-300 flex-wrap">
			<button
				type="button"
				class="btn btn-ghost btn-xs {editor.isActive('bold') ? 'bg-base-300 font-bold' : ''}"
				onclick={() => editor?.chain().focus().toggleBold().run()}
			>
				<b>B</b>
			</button>
			<button
				type="button"
				class="btn btn-ghost btn-xs {editor.isActive('italic') ? 'bg-base-300 font-bold' : ''}"
				onclick={() => editor?.chain().focus().toggleItalic().run()}
			>
				<i>I</i>
			</button>
			<button
				type="button"
				class="btn btn-ghost btn-xs {editor.isActive('strike') ? 'bg-base-300 font-bold' : ''}"
				onclick={() => editor?.chain().focus().toggleStrike().run()}
			>
				<s>S</s>
			</button>
			<div class="divider divider-horizontal m-0 px-1"></div>
			<button
				type="button"
				class="btn btn-ghost btn-xs {editor.isActive('bulletList') ? 'bg-base-300 font-bold' : ''}"
				onclick={() => editor?.chain().focus().toggleBulletList().run()}
			>
				• Lista
			</button>
			<button
				type="button"
				class="btn btn-ghost btn-xs {editor.isActive('orderedList') ? 'bg-base-300 font-bold' : ''}"
				onclick={() => editor?.chain().focus().toggleOrderedList().run()}
			>
				1. Lista
			</button>
			<button
				type="button"
				class="btn btn-ghost btn-xs {editor.isActive('taskList') ? 'bg-base-300 font-bold' : ''}"
				onclick={() => editor?.chain().focus().toggleTaskList().run()}
				aria-label="Lista de tarefas"
			>
				<ListTodo class="size-4" />
			</button>
			<div class="divider divider-horizontal m-0 px-1"></div>
			<button
				type="button"
				class="btn btn-ghost btn-xs"
				onclick={() => editor?.chain().focus().undo().run()}
				aria-label="Desfazer"
			>
				↩️
			</button>
			<button
				type="button"
				class="btn btn-ghost btn-xs"
				onclick={() => editor?.chain().focus().redo().run()}
				aria-label="Refazer"
			>
				↪️
			</button>
		</div>
	{/if}
	<div bind:this={element} class="p-3 min-h-[120px] max-h-[300px] overflow-y-auto outline-none prose prose-sm max-w-none bg-base-100"></div>
</div>

<style>
	:global(.ProseMirror) {
		outline: none;
		min-height: 120px;
	}
</style>

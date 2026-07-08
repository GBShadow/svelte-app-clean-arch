<script lang="ts">
	import TodoListContainer from '$lib/components/TodoListContainer.svelte';
</script>

<div class="flex flex-col items-center gap-4">
	<div class="text-center">
		<h1 class="text-3xl font-bold">Todo App</h1>
		<div class="badge badge-primary badge-lg mt-2">Svelte 5 Runes</div>
	</div>

	<div class="card w-full max-w-xl bg-base-100 shadow-xl">
		<div class="card-body">
			<TodoListContainer />
		</div>
	</div>
</div>

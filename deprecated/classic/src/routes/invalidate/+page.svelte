<script lang="ts">
	import TodoListContainer from '$lib/components/invalidate/TodoListContainer.svelte';

	let { data } = $props();
</script>

<h1>Todo App — Classic (invalidate)</h1>
<TodoListContainer todos={data.todos} />

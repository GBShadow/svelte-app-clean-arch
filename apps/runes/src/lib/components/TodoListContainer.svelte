<script lang="ts">
	import { onMount } from 'svelte';
	import { TodoListService } from '$lib/domain/TodoListService.svelte';
	import { TodoHttpGateway } from 'todo-domain';
	import TodoListComponent from './TodoList.svelte';

	const gateway = new TodoHttpGateway(fetch, '');
	const service = new TodoListService(gateway);

	onMount(() => {
		void service.load();
	});
</script>

<TodoListComponent {service} />

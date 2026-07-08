<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<div class="min-h-screen bg-base-200">
	<div class="navbar bg-base-100 shadow-sm">
		<div class="flex-1">
			<span class="btn btn-ghost text-xl">Todo Apps</span>
		</div>
		<div class="flex-none">
			<div class="tabs tabs-boxed">
				<a href="http://localhost:5173" class="tab">Classic</a>
				<a href="http://localhost:5174" class="tab">Remote</a>
				<a href="http://localhost:5175" class="tab tab-active">Runes</a>
			</div>
		</div>
	</div>

	<main class="container mx-auto p-4">
		{@render children()}
	</main>
</div>

<script lang="ts">
	let { children } = $props();
</script>

<nav>
	<a href="http://localhost:5173">Classic</a>
	|
	<a href="http://localhost:5174">Remote</a>
	|
	<a href="http://localhost:5175">Runes</a>
</nav>

{@render children()}

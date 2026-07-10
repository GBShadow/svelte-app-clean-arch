<script lang="ts">
	let { children } = $props();
</script>

<nav>
	<a href="/">Classic (revision)</a>
	|
	<a href="/invalidate">Classic (invalidate)</a>
	|
	<a href="http://localhost:5174">Remote</a>
	|
	<a href="http://localhost:5175">Runes</a>
</nav>

{@render children()}

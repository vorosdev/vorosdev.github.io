<script lang="ts">
	let progress = $state(0);

	$effect(() => {
		if (typeof window === 'undefined') return;
		const onScroll = () => {
			const h = document.documentElement;
			const scrolled = h.scrollTop;
			const max = h.scrollHeight - h.clientHeight;
			progress = max > 0 ? Math.min(100, Math.max(0, (scrolled / max) * 100)) : 0;
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll);
		return () => {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
		};
	});
</script>

<div class="reading-progress" style="width: {progress}%;" aria-hidden="true"></div>

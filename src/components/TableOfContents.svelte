<script lang="ts">
	const props = $props<{ headings: { depth: number; slug: string; text: string }[] }>();
	const headings = $derived(
		props.headings
			.filter((h) => h.depth >= 2 && h.depth <= 3)
			.map((h) => ({ ...h, text: h.text.replace(/#\s*$/, '').trim() }))
	);

	let activeSlug = $state<string>('');

	$effect(() => {
		if (typeof window === 'undefined') return;
		const targets = headings
			.map((h) => document.getElementById(h.slug))
			.filter((el): el is HTMLElement => Boolean(el));
		if (targets.length === 0) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries
					.filter((e) => e.isIntersecting)
					.sort(
						(a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top
					);
				if (visible[0]) {
					activeSlug = visible[0].target.id;
				}
			},
			{ rootMargin: '-80px 0px -70% 0px', threshold: 0 }
		);

		targets.forEach((t) => observer.observe(t));
		return () => observer.disconnect();
	});
</script>

{#if headings.length > 0}
	<nav class="border-l border-border" aria-label="Tabla de contenidos">
		<ul class="space-y-0.5">
			{#each headings as h (h.slug)}
				<li>
					<a
						href={`#${h.slug}`}
						class={[
							'toc-link',
							h.depth === 3 ? 'toc-h3' : '',
							activeSlug === h.slug ? 'toc-link-active' : ''
						]}
					>
						{h.text}
					</a>
				</li>
			{/each}
		</ul>
	</nav>
{/if}

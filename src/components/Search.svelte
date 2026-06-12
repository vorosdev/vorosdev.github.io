<script lang="ts">
	import Fuse from 'fuse.js';

	type Entry = {
		id: string;
		title: string;
		description: string;
		tags: string[];
		categories: string[];
		url: string;
		content: string;
	};

	let open = $state(false);
	let query = $state('');
	let loaded = $state(false);
	let fuse = $state<Fuse<Entry> | null>(null);
	let inputEl: HTMLInputElement | null = $state(null);

	const results = $derived(
		!fuse || query.trim().length < 2
			? []
			: fuse
					.search(query)
					.slice(0, 8)
					.map((r) => r.item)
	);

	async function ensureLoaded() {
		if (loaded) return;
		try {
			const res = await fetch('/search-index.json');
			if (res.ok) {
				const data = (await res.json()) as Entry[];
				fuse = new Fuse(data, {
					keys: [
						{ name: 'title', weight: 0.5 },
						{ name: 'description', weight: 0.2 },
						{ name: 'tags', weight: 0.2 },
						{ name: 'categories', weight: 0.1 },
						{ name: 'content', weight: 0.1 }
					],
					includeScore: true,
					threshold: 0.4,
					ignoreLocation: true,
					minMatchCharLength: 2
				});
				loaded = true;
			}
		} catch {
			/* ignore */
		}
	}

	async function openPanel() {
		await ensureLoaded();
		open = true;
		setTimeout(() => inputEl?.focus(), 0);
	}

	function closePanel() {
		open = false;
		query = '';
	}

	function onInput(e: Event) {
		query = (e.target as HTMLInputElement).value;
	}

	function onKey(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
			e.preventDefault();
			open ? closePanel() : openPanel();
		} else if (e.key === 'Escape' && open) {
			closePanel();
		}
	}

	$effect(() => {
		if (typeof window === 'undefined') return;
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
</script>

<button
	type="button"
	class="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-bg-soft px-2.5 text-sm text-fg-muted transition hover:border-accent hover:text-fg sm:px-3"
	aria-label="Buscar"
	onclick={openPanel}
>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="14"
		height="14"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
		class="shrink-0"
	>
		<circle cx="11" cy="11" r="8"></circle>
		<path d="m21 21-4.3-4.3"></path>
	</svg>
	<span class="hidden sm:inline">Buscar</span>
	<kbd
		class="hidden rounded border border-border px-1 font-mono text-[10px] text-fg-subtle sm:inline"
		>⌘K</kbd
	>
</button>

{#if open}
	<div
		class="search-backdrop fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh] sm:pt-[15vh]"
		role="dialog"
		aria-modal="true"
		aria-label="Buscar en el blog"
		onclick={(e) => {
			if (e.target === e.currentTarget) closePanel();
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') closePanel();
		}}
		tabindex="-1"
	>
		<div class="search-modal w-full max-w-xl" role="document">
			<div class="search-modal-header flex items-center gap-3 px-4 py-3">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
					class="shrink-0 text-fg-muted"
				>
					<circle cx="11" cy="11" r="8"></circle>
					<path d="m21 21-4.3-4.3"></path>
				</svg>
				<input
					bind:this={inputEl}
					type="search"
					placeholder="Busca por título, tag o contenido…"
					value={query}
					oninput={onInput}
					class="search-modal-input min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle"
					aria-label="Buscar en el blog"
					autocomplete="off"
					spellcheck="false"
				/>
				<button
					type="button"
					onclick={closePanel}
					class="shrink-0 rounded border border-border bg-bg-soft px-1.5 py-0.5 font-mono text-[10px] uppercase text-fg-subtle transition hover:border-fg-muted hover:text-fg"
					aria-label="Cerrar búsqueda"
				>
					esc
				</button>
			</div>

			<div class="search-modal-body">
				{#if !loaded}
					<p class="px-4 py-8 text-center text-sm text-fg-muted">Cargando índice…</p>
				{:else if query.trim().length < 2}
					<p class="px-4 py-8 text-center text-sm text-fg-muted">
						Escribe al menos 2 caracteres para buscar.
					</p>
				{:else if results.length === 0}
					<p class="px-4 py-8 text-center text-sm text-fg-muted">
						Sin resultados para &ldquo;{query}&rdquo;.
					</p>
				{:else}
					<ul class="p-2">
						{#each results as r (r.id)}
							<li>
								<a
									href={r.url}
									onclick={closePanel}
									class="search-result block rounded-md p-2 transition"
								>
									<p class="text-sm font-medium text-fg">{r.title}</p>
									{#if r.description}
										<p class="mt-0.5 line-clamp-2 text-xs text-fg-muted">{r.description}</p>
									{/if}
									{#if r.tags.length > 0}
										<p class="mt-1 text-[11px] text-fg-subtle">
											{r.tags
												.slice(0, 4)
												.map((t) => `#${t}`)
												.join(' ')}
										</p>
									{/if}
								</a>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	</div>
{/if}

<script lang="ts">
	type Props = {
		code: string;
		lang?: string;
		filename?: string;
		showLineNumbers?: boolean;
	};

	const props: Props = $props();
	const lang = $derived(props.lang ?? 'text');
	const showLines = $derived(props.showLineNumbers ?? true);

	let copied = $state(false);
	let timer: ReturnType<typeof setTimeout> | null = null;

	async function copy() {
		try {
			await navigator.clipboard.writeText(props.code);
			copied = true;
			if (timer) clearTimeout(timer);
			timer = setTimeout(() => (copied = false), 1500);
		} catch {
			/* ignore */
		}
	}
</script>

<div class="not-prose my-4 overflow-hidden rounded-lg border border-border bg-bg-soft">
	{#if props.filename}
		<div
			class="flex items-center justify-between border-b border-border bg-bg-soft-2 px-3 py-1.5 text-xs text-fg-muted"
		>
			<span class="font-mono">{props.filename}</span>
			<span class="font-mono uppercase tracking-wider text-fg-subtle">{lang}</span>
		</div>
	{/if}
	<div class="relative">
		<button
			type="button"
			onclick={copy}
			class="absolute right-2 top-2 z-10 rounded border border-border bg-bg-soft-2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-fg-muted transition hover:border-accent hover:text-accent"
			aria-label="Copiar código"
		>
			{copied ? 'Copiado' : 'Copiar'}
		</button>
		<pre class="overflow-x-auto p-4 text-sm leading-relaxed" class:line-numbers={showLines}><code
				>{props.code}</code
			></pre>
	</div>
</div>

<style>
	.line-numbers code {
		counter-reset: line;
		display: block;
	}
	.line-numbers code :global(> *:not(br)) {
		counter-increment: line;
	}
</style>

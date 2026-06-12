<script lang="ts">
	type Props = {
		prompt?: string;
		user?: string;
		host?: string;
		output?: string;
	};

	const props: Props = $props();
	const prompt = $derived(props.prompt ?? '$');
	const user = $derived(props.user ?? 'user');
	const host = $derived(props.host ?? 'blog');
</script>

<div class="not-prose my-4 overflow-hidden rounded-lg border border-border bg-bg">
	<div class="flex items-center gap-1.5 border-b border-border bg-bg-soft-2 px-3 py-1.5">
		<span class="h-2.5 w-2.5 rounded-full bg-danger"></span>
		<span class="h-2.5 w-2.5 rounded-full bg-warning"></span>
		<span class="h-2.5 w-2.5 rounded-full bg-accent"></span>
		<span class="ml-2 font-mono text-xs text-fg-muted">
			{user}@{host}:~
		</span>
	</div>
	<div class="space-y-1 p-4 font-mono text-sm leading-relaxed">
		<div class="flex gap-2">
			<span class="select-none text-accent">{prompt}</span>
			<div class="flex-1 text-fg">
				<slot />
			</div>
		</div>
		{#if props.output}
			<pre class="overflow-x-auto whitespace-pre-wrap text-fg-muted">{props.output}</pre>
		{/if}
	</div>
</div>

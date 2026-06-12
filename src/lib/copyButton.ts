export const copyButtonTransformer = {
	name: 'copy-button',
	pre(/** @type {{ children: any[] }} */ node) {
		node.children.push({
			type: 'element',
			tagName: 'button',
			properties: {
				className: [
					'copy-button',
					'absolute top-2 right-2',
					'rounded border border-fg-muted',
					'bg-bg px-2 py-0.5',
					'font-mono text-[0.7rem] text-fg-muted',
					'cursor-pointer opacity-0',
					'transition duration-150',
					'focus-visible:opacity-100 active:scale-95',
					'[@media(hover:none)]:opacity-60'
				]
			},
			children: [{ type: 'text', value: 'Copiar' }]
		});
	}
};

// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import { unified } from '@astrojs/markdown-remark';

import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeExternalLinks from 'rehype-external-links';

import { copyButtonTransformer } from './src/lib/copyButton.ts';

const SITE = 'https://blog.voros.xyz';

export default defineConfig({
	site: SITE,
	trailingSlash: 'always',
  devToolbar: { 
    enabled: true
  },
	integrations: [svelte(), mdx(), sitemap()],
	vite: {
		plugins: [tailwindcss()]
	},
	markdown: {
		shikiConfig: {
			theme: 'github-dark-dimmed',
			wrap: true,
			transformers: [copyButtonTransformer]
		},
		processor: unified({
			rehypePlugins: [
				rehypeSlug,
				[
					rehypeAutolinkHeadings,
					{
						behavior: 'append',
						properties: {
							className: ['heading-anchor'],
							ariaLabel: 'Anchor link to section'
						},
						content: {
							type: 'element',
							tagName: 'span',
							properties: { className: ['anchor-icon'] },
							children: [{ type: 'text', value: '#' }]
						}
					}
				],
				[rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer', 'nofollow'] }]
			]
		})
	}
});

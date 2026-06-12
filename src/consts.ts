export const SITE = {
	name: 'Vor Blog',
	description: 'Notas y guías de administración de sistemas, ciberseguridad, infraestructura, etc.',
	url: 'https://blog.voros.xyz',
	defaultOgImage: '/og-default.png',
	author: {
		name: 'Vor',
		handle: 'vorosdev',
		email: 'vor@voros.xyz',
		links: [
			{ label: 'X (Twitter)', href: 'https://x.com/_vor_1' },
			{ label: 'GitHub', href: 'https://github.com/vorosdev' }
		]
	},
	nav: [
		{ href: '/', label: 'Inicio' },
		{ href: '/archive/', label: 'Archivo' },
		{ href: '/tags/', label: 'Tags' },
		{ href: '/about/', label: 'Acerca' }
	],
	giscus: {
		repo: 'vorosdev/vorosdev.github.io',
		repoId: 'R_kgDOMiH3EA',
		category: 'General',
		categoryId: 'DIC_kwDOMiH3EM4ChjYP'
	}
} as const;

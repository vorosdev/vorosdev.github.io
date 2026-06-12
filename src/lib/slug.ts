/** Slugifies a free-form string (e.g. a tag or category name) for use in URLs. */
export function slugify(value: string): string {
	return value
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^\w\s-]/g, '')
		.trim()
		.replace(/\s+/g, '-');
}

/** Extracts the file-name slug from an Astro content collection id (e.g. `"posts/foo.md"` → `"foo"`). */
export function getSlug(id: string): string {
	return (
		id
			.split('/')
			.pop()
			?.replace(/\.(md|mdx)$/, '') ?? id
	);
}

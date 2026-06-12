import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '~/consts';
import { getSlug } from '~/lib/slug';

export async function GET(context) {
	const posts = (await getCollection('posts', ({ data }) => !data.draft)).sort(
		(a, b) => b.data.date.valueOf() - a.data.date.valueOf()
	);

	return rss({
		title: SITE.name,
		description: SITE.description,
		site: context.site,
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.date,
			link: `/posts/${getSlug(post.id)}/`,
			categories: [...post.data.categories, ...post.data.tags],
			author: `${SITE.author.email} (${SITE.author.name})`
		})),
		customData: `<language>es-ES</language>`
	});
}

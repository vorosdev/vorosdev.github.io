import { getCollection } from 'astro:content';
import { getSlug } from '~/lib/slug';

export async function GET() {
	const posts = (await getCollection('posts', ({ data }) => !data.draft)).sort(
		(a, b) => b.data.date.valueOf() - a.data.date.valueOf()
	);

	const entries = posts.map((post) => ({
		id: getSlug(post.id),
		title: post.data.title,
		description: post.data.description,
		tags: post.data.tags,
		categories: post.data.categories,
		url: `/posts/${getSlug(post.id)}/`,
		content: (post.body ?? '').slice(0, 4000)
	}));

	return new Response(JSON.stringify(entries), {
		headers: {
			'Content-Type': 'application/json; charset=utf-8'
		}
	});
}

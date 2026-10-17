import type { APIRoute } from 'astro';
import { getPosts, getProjects, postPath, projectPath } from '../lib/content';
import { pageUrl } from '../lib/site';

// Every public page. The 404 page is left out; drafts and samples never reach getPosts in production.
export const GET: APIRoute = async ({ site }) => {
  const [posts, projects] = await Promise.all([getPosts(), getProjects()]);
  const day = (date: Date) => date.toISOString().slice(0, 10);

  const entries = [
    { loc: pageUrl('/', site!), lastmod: posts[0] ? day(posts[0].data.date) : undefined },
    { loc: pageUrl('/writing', site!), lastmod: posts[0] ? day(posts[0].data.date) : undefined },
    ...posts.map((post) => ({ loc: pageUrl(postPath(post), site!), lastmod: day(post.data.date) })),
    ...projects.map((project) => ({ loc: pageUrl(projectPath(project), site!), lastmod: undefined })),
  ];

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(
      ({ loc, lastmod }) => `  <url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`,
    ),
    '</urlset>',
    '',
  ].join('\n');

  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};

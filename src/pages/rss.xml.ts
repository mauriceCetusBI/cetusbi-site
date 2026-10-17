import type { APIRoute } from 'astro';
import { TAG_LABELS, getPosts, postPath } from '../lib/content';
import { SITE, fileUrl, pageUrl } from '../lib/site';

const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// RSS 2.0 feed of all published posts, newest first, with title, summary and topics.
export const GET: APIRoute = async ({ site }) => {
  const posts = await getPosts();
  const home = pageUrl('/', site!);

  const items = posts.map((post) => {
    const url = pageUrl(postPath(post), site!);
    return [
      '    <item>',
      `      <title>${escape(post.data.title)}</title>`,
      `      <link>${url}</link>`,
      `      <guid isPermaLink="true">${url}</guid>`,
      `      <pubDate>${post.data.date.toUTCString()}</pubDate>`,
      `      <description>${escape(post.data.summary)}</description>`,
      ...post.data.tags.map((tag) => `      <category>${escape(TAG_LABELS[tag])}</category>`),
      '    </item>',
    ].join('\n');
  });

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${SITE.name}</title>`,
    `    <link>${home}</link>`,
    `    <description>${escape(SITE.description)}</description>`,
    '    <language>en</language>',
    `    <atom:link href="${fileUrl('/rss.xml', site!)}" rel="self" type="application/rss+xml" />`,
    ...(posts[0] ? [`    <lastBuildDate>${posts[0].data.date.toUTCString()}</lastBuildDate>`] : []),
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');

  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};

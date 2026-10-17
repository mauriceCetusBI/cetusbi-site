import type { APIRoute } from 'astro';
import { fileUrl, isProductionSite } from '../lib/site';

// Production: everything may be crawled, and the sitemap is listed. Any other build (the
// github.io preview, local) asks crawlers to stay away, on top of the noindex meta tag.
export const GET: APIRoute = ({ site }) => {
  const body = isProductionSite(site)
    ? `User-agent: *\nAllow: /\n\nSitemap: ${fileUrl('/sitemap.xml', site!)}\n`
    : 'User-agent: *\nDisallow: /\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};

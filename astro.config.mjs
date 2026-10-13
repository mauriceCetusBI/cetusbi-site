// Not type-checked: reading process.env would need @types/node as an extra dependency.
import { defineConfig } from 'astro/config';

// SITE_URL and SITE_BASE are set by the deploy workflow. Locally the site builds at the root.
const site = process.env.SITE_URL ?? 'http://localhost:4321';
const base = process.env.SITE_BASE ?? '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
});

import contact from '../data/contact.json';

export const SITE = {
  name: 'CetusBI',
  domain: 'cetusbi.com',
  description:
    'Where cycling meets data. Ride write-ups, data engineering and the tools in between, by Maurice.',
} as const;

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Prefixes a site-absolute path ("/writing", "/#projects") with the configured base path. */
export function href(path: string): string {
  if (!path.startsWith('/')) return path;
  return `${BASE}${path}` || '/';
}

/** True only for the real domain: previews and local builds are never indexed. */
export const isProductionSite = (site: URL | undefined) => site?.hostname === SITE.domain;

/** Absolute URL of a page as it is served: directory format, so with a trailing slash. */
export function pageUrl(path: string, site: URL): string {
  const [pathname, hash] = path.split('#');
  const withSlash = pathname!.endsWith('/') ? pathname! : `${pathname}/`;
  return new URL(href(withSlash) + (hash ? `#${hash}` : ''), site).href;
}

/** Absolute URL of a file (image, feed). */
export const fileUrl = (path: string, site: URL) => new URL(href(path), site).href;

/** Default Open Graph image (1200×630, public/og/default.png). */
export const DEFAULT_OG_IMAGE = {
  path: '/og/default.png',
  alt: 'CetusBI: where cycling meets data',
  width: 1200,
  height: 630,
};

/** Strips the base path so the current route can be compared with nav paths. */
export function routeOf(pathname: string): string {
  const route = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname;
  return route.replace(/\/$/, '') || '/';
}

export interface NavItem {
  label: string;
  path: string;
  /** Route that marks this item as active, if any. */
  activeOn?: string;
}

// Projects has no index page: it points at the landing section.
export const NAV: NavItem[] = [
  { label: 'Writing', path: '/writing', activeOn: '/writing' },
  { label: 'Projects', path: '/#projects', activeOn: '/projects' },
  // About is added back when the page exists.
];

export interface SocialLink {
  label: string;
  url: string;
}

// Only links with a real URL are shown; an empty list renders no buttons at all.
export const SOCIAL: SocialLink[] = [];

/**
 * Where every "Say hi" goes: the LinkedIn profile from src/data/contact.json, or the About
 * teaser on the landing page while no URL is set. Use this for any new contact button.
 */
export const CONTACT_URL = contact.linkedin || href('/#about');

/** Attributes for a link to an outside site: opens in a new tab without leaking the opener. */
export const EXTERNAL_LINK = { target: '_blank', rel: 'noopener' } as const;

/** Same for the contact button, which stays in the tab while it still points at the About page. */
export const CONTACT_LINK = contact.linkedin ? EXTERNAL_LINK : {};

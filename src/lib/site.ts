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
  { label: 'About', path: '/about', activeOn: '/about' },
];

export const CONTACT_PATH = '/about#contact';

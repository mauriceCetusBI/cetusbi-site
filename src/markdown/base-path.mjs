// Prefixes site-absolute URLs in Markdown ("/writing/x", "/media/clip.mp4") with the configured
// base path, so links and media also work on the preview under /cetusbi-site. No-op for base "/".

const ATTRS = { a: ['href'], img: ['src'], video: ['src', 'poster'], source: ['src'] };

export function basePath(base) {
  const prefix = base.replace(/\/$/, '');
  if (!prefix) return null;

  const withBase = (value) =>
    typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.startsWith(`${prefix}/`)
      ? `${prefix}${value}`
      : value;

  return {
    name: 'cetusbi-base-path',
    element: {
      filter: Object.keys(ATTRS),
      visit(node, ctx) {
        for (const attr of ATTRS[node.tagName] ?? []) {
          const value = node.properties?.[attr];
          const next = withBase(value);
          if (next !== value) ctx.setProperty(node, attr, next);
        }
      },
    },
  };
}

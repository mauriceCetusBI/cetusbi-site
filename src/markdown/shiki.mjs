// Code blocks in articles: a Shiki theme matching the design, plus a header bar with the
// language and an optional file name: ```python title="ride_import.py"

/** Colors from the article board: keywords mint, strings and numbers yellow, comments muted. */
export const cetusTheme = {
  name: 'cetusbi',
  type: 'dark',
  colors: {
    'editor.background': '#0B1319',
    'editor.foreground': '#F8F8FF',
  },
  tokenColors: [
    {
      scope: ['keyword', 'storage', 'storage.type', 'storage.modifier', 'keyword.control', 'keyword.operator.logical', 'keyword.operator.new', 'keyword.operator.expression', 'keyword.other'],
      settings: { foreground: '#A6DDBE' },
    },
    {
      scope: ['string', 'string.quoted', 'constant.numeric', 'constant.language', 'constant.character'],
      settings: { foreground: '#E3B341' },
    },
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: '#A9BCC8' },
    },
  ],
};

const LABELS = {
  py: 'Python',
  python: 'Python',
  js: 'JavaScript',
  javascript: 'JavaScript',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  sql: 'SQL',
  dax: 'DAX',
  bash: 'Shell',
  sh: 'Shell',
  shell: 'Shell',
  powershell: 'PowerShell',
  json: 'JSON',
  yaml: 'YAML',
  yml: 'YAML',
  html: 'HTML',
  css: 'CSS',
  go: 'Go',
  plaintext: 'Text',
  text: 'Text',
};

const el = (tagName, className, children) => ({
  type: 'element',
  tagName,
  properties: className ? { className: [className] } : {},
  children,
});
const text = (value) => ({ type: 'text', value });

/** Wraps each highlighted block in .code-block with a .code-head bar above the <pre>. */
export const codeHeader = {
  name: 'cetusbi-code-header',
  root(root) {
    const pre = root.children.find((node) => node.type === 'element' && node.tagName === 'pre');
    if (!pre) return;
    const lang = this.options.lang ?? 'plaintext';
    const title = /title="([^"]+)"/.exec(this.options.meta?.__raw ?? '')?.[1];
    const head = el('div', 'code-head', [
      el('span', null, [text(LABELS[lang] ?? lang)]),
      ...(title ? [el('span', 'code-title', [text(title)])] : []),
    ]);
    root.children = [el('div', 'code-block', [head, pre])];
  },
};

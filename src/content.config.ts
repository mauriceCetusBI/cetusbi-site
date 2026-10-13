import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Sample content lives in the gitignored src/content/_samples/ and is only loaded by `astro dev`,
// or by a local test build with SAMPLES=true (for Lighthouse runs). CI never sets it, and the
// samples are not in the repo, so production builds see published content only.
export const SHOW_SAMPLES = import.meta.env.DEV || import.meta.env.SAMPLES === 'true';

const withSamples = (folder: string) =>
  SHOW_SAMPLES ? [`${folder}/**/*.md`, `_samples/${folder}/**/*.md`] : [`${folder}/**/*.md`];

// The entry id is the file name: posts/my-ride.md lives at /writing/my-ride. A post with its own
// images can be a folder instead: posts/my-ride/index.md (photos next to it) gets the same URL.
const idFromFileName = ({ entry }: { entry: string }) => {
  const parts = entry.replace(/\.md$/, '').split('/');
  return parts.at(-1) === 'index' ? parts.at(-2)! : parts.at(-1)!;
};

export const TAGS = ['Ride', 'Data', 'Build'] as const;

/** Generated cover art variants, ported from the design. */
export const COVER_ART = ['route', 'bars', 'layers', 'gauge', 'code', 'climb', 'chart'] as const;

const posts = defineCollection({
  loader: glob({ base: './src/content', pattern: withSamples('posts'), generateId: idFromFileName }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1),
      date: z.coerce.date(),
      tags: z.array(z.enum(TAGS)).min(1),
      summary: z.string().min(1),
      // Either a real image (with alt text) or one of the generated cover art variants.
      cover: z
        .union([
          z.object({ image: image(), alt: z.string().min(1) }),
          z.object({ art: z.enum(COVER_ART) }),
        ])
        .optional(),
      projects: z.array(reference('projects')).default([]),
      draft: z.boolean().default(false),
    }),
});

/** Card visuals for projects, ported from the landing board. */
export const PROJECT_ART = ['wear', 'bars', 'fuel'] as const;

export const STEP_ICONS = ['route', 'clock', 'bell', 'chart', 'code', 'bike'] as const;

// Project page sections beyond the basics are optional: a section without content is left out.
const projects = defineCollection({
  loader: glob({ base: './src/content', pattern: withSamples('projects'), generateId: idFromFileName }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1),
      /** Part of the title drawn in mint with the squiggle, e.g. "Spoke" in RoadSpoke. Default: last word. */
      titleAccent: z.string().optional(),
      summary: z.string().min(1),
      tags: z.array(z.string().min(1)).min(1),
      role: z.string().min(1),
      stack: z.array(z.string().min(1)).min(1),
      status: z.enum(['In progress', 'In beta', 'Live']),
      started: z.number().int().min(2000),
      /** Lower comes first on the landing page and in previous/next. */
      order: z.number().int().default(100),
      art: z.enum(PROJECT_ART).optional(),
      sticker: z.string().optional(),
      /** Primary button in the hero, e.g. { label: "Open the app", url: "https://…" }. */
      link: z.object({ label: z.string().min(1), url: z.url() }).optional(),
      /** Screenshot shown in the hero phone. Without it the phone shows the project art. */
      heroImage: z.object({ image: image(), alt: z.string().min(1) }).optional(),
      /** Heading of the "Why I built it" section; the Markdown body is its text. */
      why: z.string().optional(),
      /** "How it works": heading plus three-ish steps. */
      steps: z
        .object({
          heading: z.string().min(1),
          items: z
            .array(z.object({ title: z.string().min(1), text: z.string().min(1), icon: z.enum(STEP_ICONS).optional() }))
            .min(1),
        })
        .optional(),
      /** "Screens": screenshots in phone frames. */
      screens: z
        .array(z.object({ image: image(), alt: z.string().min(1), caption: z.string().min(1) }))
        .optional(),
      /** One or two lines above the stack pills in "Built with". */
      stackNote: z.string().optional(),
      draft: z.boolean().default(false),
    }),
});

const goalBase = {
  id: z.string(),
  order: z.number().int(),
  label: z.string().min(1),
  icon: z.enum(['fuel', 'power', 'mountain']),
  headline: z.string().min(1),
  unit: z.string().min(1),
  note: z.string().optional(),
  /** Month of the last manual update, YYYY-MM. */
  updated: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
};

const goals = defineCollection({
  loader: file('src/data/goals.json'),
  schema: z.discriminatedUnion('kind', [
    z.object({
      ...goalBase,
      kind: z.literal('ring'),
      target: z.number().positive(),
      current: z.number().min(0),
      /** Unit shown after the current value, e.g. "g / hour". */
      currentUnit: z.string().min(1),
    }),
    z.object({
      ...goalBase,
      kind: z.literal('steps'),
      steps: z.array(z.string().min(1)).min(2),
      /** Number of steps completed, 0 to steps.length. */
      done: z.number().int().min(0),
      currentLabel: z.string().min(1),
    }),
  ]),
});

export const collections = { posts, projects, goals };

import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;
export type Project = CollectionEntry<'projects'>;
export type Goal = CollectionEntry<'goals'>;
export type Tag = Post['data']['tags'][number];

export const TAG_LABELS: Record<Tag, string> = {
  Ride: 'Ride',
  Data: 'Data',
  Build: 'Build log',
};

export const tagLabel = (tags: readonly Tag[]) => tags.map((tag) => TAG_LABELS[tag]).join(' · ');

/** True for entries loaded from src/content/_samples/ (dev only). */
export const isSample = (entry: { filePath?: string }) => !!entry.filePath?.includes('/_samples/');

// Drafts show up in `astro dev` (marked as draft) and never in a production build.
const isVisible = ({ data }: { data: { draft: boolean } }) => import.meta.env.DEV || !data.draft;

const WORDS_PER_MINUTE = 220;

/** Minutes to read a Markdown body. Code blocks, markup and URLs don't count as words. */
export function readingTime(markdown = ''): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_`~|-]/g, ' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** Visible posts, newest first. */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', isVisible);
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** Visible projects in landing-page order, then alphabetically. */
export async function getProjects(): Promise<Project[]> {
  const projects = await getCollection('projects', isVisible);
  return projects.sort(
    (a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title),
  );
}

/** Posts that reference a project, newest first. */
export async function getPostsForProject(projectId: string): Promise<Post[]> {
  const posts = await getPosts();
  return posts.filter((post) => post.data.projects.some((ref) => ref.id === projectId));
}

// Spelled out rather than Intl: recent ICU versions abbreviate September as "Sept".
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "12 Oct 2026", as in the design. */
export const formatDate = (date: Date) =>
  `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;

export async function getGoals(): Promise<Goal[]> {
  const goals = await getCollection('goals');
  return goals.sort((a, b) => a.data.order - b.data.order);
}

/** Progress towards a goal, 0 to 1. */
export function goalProgress({ data }: Goal): number {
  const ratio = data.kind === 'ring' ? data.current / data.target : data.done / data.steps.length;
  return Math.min(1, Math.max(0, ratio));
}

/** "October 2026": the most recent manual update across all goals. */
export function goalsUpdatedLabel(goals: Goal[]): string | undefined {
  const latest = goals.map((goal) => goal.data.updated).sort().at(-1);
  if (!latest) return undefined;
  const [year, month] = latest.split('-').map(Number);
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year!, month! - 1, 1)),
  );
}

/**
 * What Samwell reads back from the podcast and blog tools, and the names the
 * approval card asks about. Pure: no I/O and nothing from React Native.
 */
import type { FollowFeedsOutputSchema } from 'samwell-shared';
import type { z } from 'zod';

import type { DirectoryBlog, DirectorySection } from '@/services/blogs/directory';
import type { PodcastPick } from '@/services/onboarding-tools/shortlist';

/** What `follow_podcasts` and `follow_blogs` hand back. */
export type FollowResult = z.infer<typeof FollowFeedsOutputSchema>;

/** "A", "A and B", "A, B and C". */
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/**
 * Whether a message ends by asking something: its last line ends in a
 * question mark, past any closing quote, bracket or emphasis.
 */
export function endsWithQuestion(text: string): boolean {
  const lastLine = text.trim().split('\n').pop() ?? '';
  return /\?[\s"'\u201d\u2019)*_]*$/.test(lastLine);
}

/** Enough to choose from without spending the turn on a long tail. */
export const PODCAST_CANDIDATE_LIMIT = 15;

export function formatPodcastCandidates(query: string, shows: PodcastPick[]): string {
  if (shows.length === 0) {
    return `Nothing in Apple's podcast directory matched "${query}". Try a different angle before telling them there is nothing.`;
  }
  const lines = shows.map((show) => `${show.id}: "${show.title}"${show.author ? ` by ${show.author}` : ''}`);
  return `Podcasts matching "${query}". Pick the ones that genuinely fit what they told you, not the first ones:\n${lines.join('\n')}`;
}

/**
 * A directory blog's id: a slug of its name, "james-clear".
 *
 * Not its place in the list. That changes whenever the directory does, and a
 * conversation resumed after an update would then follow a different blog
 * from the one Samwell named. A name only changes if the blog does.
 */
export function blogSlug(blog: Pick<DirectoryBlog, 'title'>): string {
  return blog.title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f'\u2019]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function blogBySlug(blogs: DirectoryBlog[], slug: string): DirectoryBlog | null {
  return blogs.find((blog) => blogSlug(blog) === slug) ?? null;
}

export function formatBlogDirectory(sections: DirectorySection[]): string {
  const body = sections
    .map((section) => {
      const lines = section.blogs.map((blog) => `${blogSlug(blog)}: ${blog.title}. ${blog.blurb}`);
      return `${section.label}\n${lines.join('\n')}`;
    })
    .join('\n\n');
  return `The blogs Open Citadel recommends, by section. Pick the ones that genuinely fit what they told you:\n\n${body}`;
}

/** The numeric ids in a tool call's input, ignoring anything else there. */
export function numberIds(value: unknown): number[] {
  return Array.isArray(value) ? value.filter((id): id is number => typeof id === 'number') : [];
}

/** The same, for ids that are strings. */
export function stringIds(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
}

/**
 * Follows run side by side (the waits are the network, and three in a row
 * tripled them), then are read back in the order he named them.
 */
export function followOutcome<T>(
  items: T[],
  settled: PromiseSettledResult<unknown>[],
  name: (item: T) => string,
): FollowResult {
  const followed: string[] = [];
  const failed: FollowResult['failed'] = [];
  settled.forEach((result, index) => {
    const itemName = name(items[index]);
    if (result.status === 'fulfilled') followed.push(itemName);
    else {
      const reason = result.reason;
      failed.push({ name: itemName, error: reason instanceof Error ? reason.message : 'Could not follow it.' });
    }
  });
  return { ok: followed.length > 0, followed, failed };
}

/**
 * The app's record of something really done in the conversation, written
 * into it as a note Samwell reads and the reader does not see. The prompt
 * tells him these lines are the truth about their library; see `RECORD_RULE`
 * in samwell-shared.
 */
export const ACTION_NOTE_PREFIX = 'Done in this conversation, confirmed by the app:';

type SetUpOutcome = { ok: boolean; imported: number; folder: { folderName: string } | null };

/** A note for whichever tool just ran, or null when it changed nothing. */
export function onboardingActionNote(toolName: string, result: unknown): string | null {
  const done = (what: string) => `${ACTION_NOTE_PREFIX} ${what}`;
  const r = result as Partial<SetUpOutcome & FollowResult & { downloaded: string[] }> | null;
  if (!r?.ok) return null;
  switch (toolName) {
    case 'set_up_library': {
      const folder = r.folder?.folderName ? ` ("${r.folder.folderName}")` : '';
      const count = r.imported ?? 0;
      return count > 0
        ? done(`moved ${count} EPUB ${count === 1 ? 'book' : 'books'} into their library folder${folder}.`)
        : done(`made their library folder${folder}, but no EPUB books were in it.`);
    }
    case 'download_free_books':
      return r.downloaded?.length ? done(`downloaded ${joinNames(r.downloaded)} into their library.`) : null;
    case 'follow_podcasts':
      return r.followed?.length ? done(`followed the podcasts ${joinNames(r.followed)}.`) : null;
    case 'follow_blogs':
      return r.followed?.length ? done(`followed the blogs ${joinNames(r.followed)}.`) : null;
    default:
      return null;
  }
}

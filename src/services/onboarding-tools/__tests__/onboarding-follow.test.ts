import { describe, expect, it } from 'vitest';

import { BLOG_DIRECTORY, DIRECTORY_BLOGS } from '@/services/blogs/directory';
import {
  blogBySlug,
  blogSlug,
  ACTION_NOTE_PREFIX,
  endsWithQuestion,
  followOutcome,
  formatBlogDirectory,
  formatPodcastCandidates,
  joinNames,
  numberIds,
  onboardingActionNote,
  stringIds,
} from '@/services/onboarding-tools/format';
import { createShortlist } from '@/services/onboarding-tools/shortlist';

describe('createShortlist', () => {
  it('keeps what every search returned, not only the last', () => {
    const list = createShortlist<{ id: number; title: string }>();
    list.hold([{ id: 1, title: 'One' }]);
    list.hold([{ id: 2, title: 'Two' }]);
    expect(list.pick([1, 2]).map((item) => item.title)).toEqual(['One', 'Two']);
  });

  it('drops ids it never held, and repeats', () => {
    const list = createShortlist<{ id: number }>();
    list.hold([{ id: 7 }]);
    expect(list.pick([7, 99, 7])).toEqual([{ id: 7 }]);
  });

  it('forgets everything on clear', () => {
    const list = createShortlist<{ id: number }>();
    list.hold([{ id: 7 }]);
    list.clear();
    expect(list.pick([7])).toEqual([]);
  });
});

describe('joinNames', () => {
  it('reads as a sentence', () => {
    expect(joinNames([])).toBe('');
    expect(joinNames(['A'])).toBe('A');
    expect(joinNames(['A', 'B'])).toBe('A and B');
    expect(joinNames(['A', 'B', 'C'])).toBe('A, B and C');
  });
});

describe('blog slugs', () => {
  it('are plain and readable', () => {
    expect(blogSlug({ title: 'James Clear' })).toBe('james-clear');
    expect(blogSlug({ title: "The Philosophers' Magazine" })).toBe('the-philosophers-magazine');
    expect(blogSlug({ title: 'Mr. Money Mustache' })).toBe('mr-money-mustache');
    expect(blogSlug({ title: 'Café Été' })).toBe('cafe-ete');
  });

  it('are unique across the directory, so each one names one blog', () => {
    const slugs = DIRECTORY_BLOGS.map(blogSlug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.every((slug) => slug.length > 0)).toBe(true);
  });

  it('match what list_blogs shows, and resolve back to the blog', () => {
    const listed = formatBlogDirectory(BLOG_DIRECTORY);
    for (const blog of DIRECTORY_BLOGS) {
      expect(listed).toContain(`${blogSlug(blog)}: ${blog.title}.`);
      expect(blogBySlug(DIRECTORY_BLOGS, blogSlug(blog))).toBe(blog);
    }
  });

  it('resolve nothing for a slug that is not on the list', () => {
    expect(blogBySlug(DIRECTORY_BLOGS, 'made-up-blog')).toBeNull();
  });
});

describe('formatPodcastCandidates', () => {
  it('lists ids with titles and authors', () => {
    const text = formatPodcastCandidates('stoicism', [
      { id: 12, title: 'The Daily Stoic', author: 'Ryan Holiday', feedUrl: 'https://x' },
      { id: 13, title: 'No Author', author: null, feedUrl: 'https://y' },
    ]);
    expect(text).toContain('12: "The Daily Stoic" by Ryan Holiday');
    expect(text).toMatch(/13: "No Author"$/m);
  });

  it('says so when nothing matched', () => {
    expect(formatPodcastCandidates('zzz', [])).toContain('Nothing');
  });
});

describe('ids from a tool call', () => {
  it('keeps only ids of the expected kind', () => {
    expect(numberIds([1, 'x', 2])).toEqual([1, 2]);
    expect(stringIds(['a', 3, 'b'])).toEqual(['a', 'b']);
    expect(numberIds(undefined)).toEqual([]);
    expect(stringIds('a')).toEqual([]);
  });
});

describe('followOutcome', () => {
  it('reads settled follows back by name, in order', () => {
    const outcome = followOutcome(
      [{ t: 'A' }, { t: 'B' }, { t: 'C' }],
      [
        { status: 'fulfilled', value: undefined },
        { status: 'rejected', reason: new Error('No feed') },
        { status: 'fulfilled', value: undefined },
      ],
      (item) => item.t,
    );
    expect(outcome).toEqual({ ok: true, followed: ['A', 'C'], failed: [{ name: 'B', error: 'No feed' }] });
  });

  it('is not ok when nothing was followed', () => {
    const outcome = followOutcome([{ t: 'A' }], [{ status: 'rejected', reason: 'x' }], (item) => item.t);
    expect(outcome.ok).toBe(false);
    expect(outcome.failed[0].error).toBe('Could not follow it.');
  });
});

describe('endsWithQuestion', () => {
  it('sees the offer that ended onboarding early', () => {
    expect(
      endsWithQuestion(
        'Your library is ready with 7 books.\n\nWould you like me to find a few podcasts and blogs to follow, and what are you working toward?',
      ),
    ).toBe(true);
  });

  it('sees a question behind a closing quote or emphasis', () => {
    expect(endsWithQuestion('Shall I find some? ')).toBe(true);
    expect(endsWithQuestion('He asked, "what next?"')).toBe(true);
    expect(endsWithQuestion('*Ready to begin?*')).toBe(true);
  });

  it('lets a goodbye through, even one with a question earlier on', () => {
    expect(endsWithQuestion('What will you read first? Whatever it is, bring it to me.\n\nGoodbye for now.')).toBe(false);
    expect(endsWithQuestion('')).toBe(false);
  });
});

describe('onboardingActionNote', () => {
  it('records what each tool really did', () => {
    expect(
      onboardingActionNote('download_free_books', {
        ok: true,
        downloaded: ['My Life and Work', 'The Art of Money Getting'],
        failed: [],
      }),
    ).toBe(`${ACTION_NOTE_PREFIX} downloaded My Life and Work and The Art of Money Getting into their library.`);
    expect(
      onboardingActionNote('follow_podcasts', { ok: true, followed: ['Founders'], failed: [] }),
    ).toBe(`${ACTION_NOTE_PREFIX} followed the podcasts Founders.`);
    expect(
      onboardingActionNote('set_up_library', {
        ok: true,
        imported: 1,
        folder: { platform: 'android', folderName: 'Open Citadel' },
      }),
    ).toBe(`${ACTION_NOTE_PREFIX} moved 1 EPUB book into their library folder ("Open Citadel").`);
  });

  it('records nothing that did not happen', () => {
    expect(onboardingActionNote('follow_blogs', { ok: false, followed: [], failed: [] })).toBeNull();
    expect(onboardingActionNote('download_free_books', { ok: true, downloaded: [] })).toBeNull();
    expect(onboardingActionNote('find_podcasts', { ok: true })).toBeNull();
    expect(onboardingActionNote('follow_blogs', null)).toBeNull();
  });
});

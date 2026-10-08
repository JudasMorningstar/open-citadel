/**
 * What the onboarding card asks, for each tool that needs a go-ahead.
 *
 * Each one is asked by somebody the reader met ninety seconds ago, so each
 * names what happens to their files, or which shows and blogs, rather than
 * naming the tool. The Android library wording says MOVES because it does,
 * and finding that out afterwards is the one thing that would break the trust
 * this whole conversation exists to build.
 *
 * `approvalCopy` asks here first. Kept apart from it because it is its own
 * conversation's wording, and because the names come from the shortlists.
 */
import { approve, field, type ApprovalCopy } from '@/services/approval-copy/base';
import { DIRECTORY_BLOGS } from '@/services/blogs/directory';
import { blogBySlug, joinNames, numberIds, stringIds } from '@/services/onboarding-tools/format';
import { freeBookShortlist, podcastShortlist } from '@/services/onboarding-tools/shortlist';

/** The names, or a fallback when none resolve (an app restarted mid-turn). */
function named(names: string[], fallback: string): string {
  return names.length > 0 ? joinNames(names) : fallback;
}

function follow(title: string, body: string): ApprovalCopy {
  return { ...approve(title, body), confirmLabel: 'FOLLOW' };
}

export function onboardingApprovalCopy(toolName: string, input: unknown): ApprovalCopy | null {
  switch (toolName) {
    case 'set_up_library':
      return {
        title: 'Set up your library?',
        body:
          process.env.EXPO_OS === 'ios'
            ? 'Samwell will ask you to pick your EPUB books, then copy them into the folder Open Citadel keeps. Your originals stay exactly where they are.'
            : 'Samwell will ask you which folder your books are in, make an Open Citadel folder inside it, and move every EPUB he finds into it. The books stay on your phone, in the new folder.',
        confirmLabel: 'SET IT UP',
        destructive: false,
      };
    case 'download_free_books': {
      const names = freeBookShortlist.pick(numberIds(field(input, 'gutenberg_ids'))).map((book) => book.title);
      return approve(
        'Download them?',
        `Samwell will download ${named(names, 'these books')} from Project Gutenberg into your Open Citadel folder. They are free and public domain.`,
      );
    }
    case 'follow_podcasts': {
      const names = podcastShortlist.pick(numberIds(field(input, 'podcast_ids'))).map((show) => show.title);
      return follow(
        'Follow these shows?',
        `Samwell will follow ${named(names, 'these shows')}. They will be on the Podcasts side of your Library. Nothing is downloaded.`,
      );
    }
    case 'follow_blogs': {
      const names = stringIds(field(input, 'blog_ids')).flatMap(
        (slug) => blogBySlug(DIRECTORY_BLOGS, slug)?.title ?? [],
      );
      return follow(
        'Follow these blogs?',
        `Samwell will follow ${named(names, 'these blogs')}. Their posts will be on the Blogs side of your Library.`,
      );
    }
    default:
      return null;
  }
}

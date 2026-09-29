/**
 * `find_free_books` and `download_free_books`: Project Gutenberg, for somebody
 * with no books of their own yet.
 */
import { cloudHeaders } from '@/services/cloud-identity';
import { downloadBooksIntoLibrary } from '@/services/gutenberg/download';
import { freeBookShortlist, type FreeBookPick } from '@/services/onboarding-tools/shortlist';
import { useSettingsStore } from '@/stores/settings';

type FreeBook = Omit<FreeBookPick, 'epubUrl'>;

type SearchResponse = {
  results?: { id: number; title: string; author: string; subjects: string[]; epubUrl: string }[];
};

export async function runFindFreeBooks(input: { interests: string }): Promise<{
  candidates: FreeBook[];
  formatted: string;
  error?: string;
}> {
  const baseUrl = useSettingsStore.getState().cloudBaseUrl;
  if (!baseUrl) {
    return { candidates: [], formatted: '', error: 'Samwell Cloud is not configured.' };
  }

  try {
    const headers = await cloudHeaders();
    const url = `${baseUrl}/library/gutenberg/search?q=${encodeURIComponent(input.interests)}`;
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Search returned HTTP ${response.status}`);
    }

    const body = (await response.json()) as SearchResponse;
    const results = body.results ?? [];
    // Held so `download_free_books` can turn an id back into a URL. See
    // `shortlist.ts`.
    freeBookShortlist.hold(results);

    if (results.length === 0) {
      return {
        candidates: [],
        formatted:
          'Project Gutenberg had nothing matching that. Say so honestly and offer to try a different angle, in their words rather than yours.',
        error: undefined,
      };
    }

    const formatted = results
      .map((book) => {
        const subjects = book.subjects.length > 0 ? ` [${book.subjects.join('; ')}]` : '';
        return `${book.id}: "${book.title}" by ${book.author}${subjects}`;
      })
      .join('\n');

    return {
      candidates: results.map(({ id, title, author, subjects }) => ({
        id,
        title,
        author,
        subjects,
      })),
      formatted: `Free books on Project Gutenberg matching "${input.interests}". Pick the three that genuinely fit what they told you, not the first three:\n${formatted}`,
    };
  } catch (error) {
    console.warn('[onboarding] find_free_books failed:', error);
    return {
      candidates: [],
      formatted: '',
      error:
        'Could not reach Project Gutenberg. Tell them their library is empty for now and that they can add books from the Library screen whenever they like.',
    };
  }
}

export async function runDownloadFreeBooks(input: { gutenberg_ids: number[] }): Promise<{
  ok: boolean;
  downloaded: string[];
  failed: { id: number; error: string }[];
  error?: string;
}> {
  // Resolved against what the searches returned, never trusted from the
  // model. See `shortlist.ts`.
  const chosen = freeBookShortlist.pick(input.gutenberg_ids);

  if (chosen.length === 0) {
    return {
      ok: false,
      downloaded: [],
      failed: [],
      error:
        'None of those ids came from the search results. Call find_free_books first and choose from what it returns.',
    };
  }

  try {
    const { downloaded, failed, cancelled } = await downloadBooksIntoLibrary(chosen);
    if (cancelled) {
      return {
        ok: false,
        downloaded: [],
        failed: [],
        error:
          'The user closed the folder picker, so there is nowhere to put the books. That is their decision. Do not try again unless they ask.',
      };
    }
    return { ok: downloaded.length > 0, downloaded, failed };
  } catch (error) {
    console.warn('[onboarding] download_free_books failed:', error);
    return {
      ok: false,
      downloaded: [],
      failed: [],
      error: error instanceof Error ? error.message : 'The downloads failed.',
    };
  }
}

/**
 * `set_up_library`: the reader's own EPUBs, brought into a folder Open
 * Citadel reads.
 */
import { followedFeedUrls } from '@/services/blogs/blogs';
import { hasLibrary, setUpLibrary, type LibrarySetupResult } from '@/services/library-setup';
import { libraryReady } from '@/services/onboarding-tools/library-ready';
import { followedShowKeys } from '@/services/podcasts/shows';

/**
 * What Samwell reads back after the library is made.
 *
 * Prose rather than the raw counts, because the two platforms did different
 * things and he has to describe the right one. The word MOVED is deliberate:
 * he is told to say so before the call, and the result says so again, since
 * that is the sentence the reader needs to have heard.
 */
function describeSetup(result: LibrarySetupResult): string {
  if (result.error === 'cancelled') {
    return 'The user closed the picker without choosing anything. Nothing was changed. Treat this as their decision, not a failure, and do not call this tool again unless they ask.';
  }
  if (!result.ok) {
    return result.error ?? 'The library could not be set up.';
  }

  const noun = result.imported === 1 ? 'book' : 'books';
  const verb = result.platform === 'android' ? 'moved' : 'copied';
  const skipped =
    result.skipped > 0
      ? ` ${result.skipped} would not open and were left where they were.`
      : '';

  if (result.imported === 0) {
    return `The "${result.folderName}" folder was created, but no EPUB books were found in the folder they picked. Their library is empty for now. Offer to find them some free books instead.${skipped}`;
  }

  return `Done. ${result.imported} ${noun} ${verb} into their "${result.folderName}" folder, and that folder is now their library.${skipped}`;
}

export async function runSetUpLibrary(): Promise<{
  ok: boolean;
  folder: { platform: 'android' | 'ios'; folderName: string } | null;
  imported: number;
  skipped: number;
  summary: string;
  error?: string;
}> {
  try {
    const result = await setUpLibrary();
    const summary = describeSetup(result);
    /*
     * Books, not just a folder.
     *
     * A pick that found nothing leaves an empty Open Citadel folder and a
     * conversation that carries on to free books, so marking readiness there
     * would swap the reader's text field for a GO TO MY LIBRARY button in the
     * middle of Samwell asking them a question.
     */
    if (result.ok && result.imported > 0) {
      libraryReady();
    }
    return {
      ok: result.ok,
      folder: result.folderName
        ? { platform: result.platform, folderName: result.folderName }
        : null,
      imported: result.imported,
      skipped: result.skipped,
      summary,
      // `error` only when it did not work. The prose lives in `summary` either
      // way; a success message in a field called `error` is how a model ends
      // up apologising for something that went fine.
      ...(result.ok ? {} : { error: summary }),
    };
  } catch (error) {
    console.warn('[onboarding] set_up_library failed:', error);
    const summary =
      error instanceof Error
        ? `Setting up the library failed: ${error.message}`
        : 'Setting up the library failed.';
    return { ok: false, folder: null, imported: 0, skipped: 0, summary, error: summary };
  }
}

/**
 * Is anything in their library yet: a books folder, a followed show, or a
 * followed blog?
 *
 * What the leave link is seeded from when a conversation opens, since the
 * tools that set it may have run in a process that is gone. Any of the three
 * counts, because a reader who followed three shows and brought no books has
 * a library to go to.
 */
export async function libraryHasSomething(): Promise<boolean> {
  if (await hasLibrary()) return true;
  const [shows, blogs] = await Promise.all([followedShowKeys(), followedFeedUrls()]);
  return shows.feedUrls.size > 0 || blogs.size > 0;
}

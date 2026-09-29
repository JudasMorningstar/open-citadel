/**
 * What Samwell can actually do while setting somebody up.
 *
 * The definitions live in `samwell-shared/onboarding-tools`, because the server
 * has to send the same schemas it will be called back with. The work lives
 * here, because every one of these touches the device: a folder, the reader's
 * own files, a download, a followed show or blog, and the flag that ends the
 * first run. One module per kind, in `onboarding-tools/`; this is their entry.
 *
 * Each executor returns the tool's output schema verbatim, including its
 * failures. A tool that throws takes the whole turn down with it and leaves
 * Samwell mid-sentence; a tool that returns `{ ok: false, error }` lets him say
 * what went wrong, which is the difference between an app that broke and a
 * person who told you something did not work.
 */
import { cloudHeaders } from '@/services/cloud-identity';
import type { FinishTurn } from '@/services/onboarding-tools/finish-turn';
import { endsWithQuestion, joinNames } from '@/services/onboarding-tools/format';
import { useSettingsStore } from '@/stores/settings';

export { runListBlogs, runFollowBlogs } from '@/services/onboarding-tools/blogs';
export { runDownloadFreeBooks, runFindFreeBooks } from '@/services/onboarding-tools/free-books';
export { runSetUpLibrary } from '@/services/onboarding-tools/library';
export { runFindPodcasts, runFollowPodcasts } from '@/services/onboarding-tools/podcasts';

/**
 * End the free conversation.
 *
 * Two side effects and no local flag of its own, which is the point. The
 * composer's `done` state is derived from `settings.onboarding`, so there is
 * one answer to "is onboarding over" rather than a store field that can
 * disagree with the thing the router reads.
 *
 * The server report is fire and forget. It closes the grant so the free route
 * is not open forever, and a failed report is not worth taking a goodbye down
 * over: the turn ceiling closes an abandoned grant on its own.
 *
 * Split from the tool because the tool is not the only way out. Tapping GO TO
 * MY LIBRARY has to do exactly this too, and on the run that prompted the
 * split it was the only thing that did: Samwell said his goodbye and then did
 * not call anything, three times running.
 */
export async function completeOnboarding(): Promise<void> {
  const baseUrl = useSettingsStore.getState().cloudBaseUrl;
  if (baseUrl) {
    void (async () => {
      try {
        await fetch(`${baseUrl}/onboarding/complete`, {
          method: 'POST',
          headers: await cloudHeaders(),
        });
      } catch (error) {
        if (__DEV__) console.warn('[onboarding] Could not close the grant:', error);
      }
    })();
  }

  await useSettingsStore.getState().finishOnboarding();
}

/**
 * `finish_onboarding`, refused while he is still waiting on something.
 *
 * The model has asked "shall I find you a few podcasts?" and called this in
 * the same breath, which ended onboarding under a question the reader never
 * got to answer: the field went, and GO TO MY LIBRARY took its place. So his
 * last words, and the goodbye itself, must not end in a question, and no card
 * of his may still be waiting. The prompt says so; this makes it true
 * whatever the model does.
 */
export async function runFinishOnboarding(
  turn: FinishTurn,
  goodbye: string,
): Promise<{ ok: boolean; error?: string }> {
  if (turn.openCalls.length > 0) {
    return {
      ok: false,
      error: `Not finished: ${joinNames([...new Set(turn.openCalls)])} must finish first. Wait for the result, then call finish_onboarding again.`,
    };
  }
  if (endsWithQuestion(turn.said)) {
    return {
      ok: false,
      error:
        'Not finished: your message asks them a question. Say nothing more now. Wait for their answer, and call finish_onboarding only when you are done.',
    };
  }
  if (endsWithQuestion(goodbye)) {
    return {
      ok: false,
      error:
        'Not finished: your goodbye asks them a question. If you are waiting on an answer, do not finish yet. Otherwise call finish_onboarding again with a goodbye that asks nothing.',
    };
  }
  await completeOnboarding();
  return { ok: true };
}

import { clientTools, type UIMessage } from '@tanstack/ai-client';
import {
  downloadFreeBooksTool,
  explainAppTool,
  findFreeBooksTool,
  findPodcastsTool,
  finishOnboardingTool,
  followBlogsTool,
  followPodcastsTool,
  listBlogsTool,
  setUpLibraryTool,
} from 'samwell-shared';

import { runExplainApp } from '@/services/chat-tools';
import {
  runDownloadFreeBooks,
  runFindFreeBooks,
  runFindPodcasts,
  runFinishOnboarding,
  runFollowBlogs,
  runFollowPodcasts,
  runListBlogs,
  runSetUpLibrary,
} from '@/services/onboarding-tools';
import { finishTurn } from '@/services/onboarding-tools/finish-turn';
import { onboardingActionNote } from '@/services/onboarding-tools/format';

/**
 * Onboarding's tools: the library, the free books, a few podcasts and blogs,
 * and the way out.
 *
 * Nothing from the reading or Compass catalogues, and that is structural
 * rather than a matter of taste. This is the only conversation where the model
 * has never met the person and cannot be steered by anything it knows about
 * them, so the smaller the surface the fewer ways the first two minutes go
 * somewhere strange.
 *
 * No `ToolCallContext` either, because none of these touch a chat session or
 * a book. They touch the file system.
 */
export type OnboardingToolHooks = {
  /** `finish_onboarding` ran, with the goodbye that is his last message. */
  onFinished: (goodbye: string) => void;
  /** The conversation so far, so a goodbye can be checked against it. */
  messages: () => UIMessage[];
  /** Something was really done; see `onboardingActionNote`. */
  onAction?: (note: string) => void;
};

export function createOnboardingClientTools({ onFinished, messages, onAction }: OnboardingToolHooks) {
  // The result goes back to the model untouched; the note goes into the
  // transcript, so later turns can see what earlier ones did.
  const recorded = async <T,>(toolName: string, work: Promise<T>): Promise<T> => {
    const result = await work;
    const note = onboardingActionNote(toolName, result);
    if (note) onAction?.(note);
    return result;
  };
  return clientTools(
    setUpLibraryTool.client(async () => recorded('set_up_library', runSetUpLibrary())),
    findFreeBooksTool.client(async (input) => runFindFreeBooks(input)),
    downloadFreeBooksTool.client(async (input) =>
      recorded('download_free_books', runDownloadFreeBooks(input)),
    ),
    findPodcastsTool.client(async (input) => runFindPodcasts(input)),
    followPodcastsTool.client(async (input) =>
      recorded('follow_podcasts', runFollowPodcasts(input)),
    ),
    listBlogsTool.client(async () => runListBlogs()),
    followBlogsTool.client(async (input) => recorded('follow_blogs', runFollowBlogs(input))),
    finishOnboardingTool.client(async (input) => {
      // Missing when a server not yet redeployed sends the old schema, which
      // had no goodbye; the app does not validate a call's input.
      const goodbye = input?.goodbye ?? '';
      const result = await runFinishOnboarding(finishTurn(messages()), goodbye);
      // Refused (he is still waiting on something): the model hears why.
      if (!result.ok) return result;
      // The turn is over. See `finished` in `sendCloudChatTurn`.
      onFinished(goodbye);
      /*
       * And no result goes back, on purpose.
       *
       * The ChatClient sends the model another turn as soon as every tool
       * call it made has a result; nothing in the library lets a tool say
       * "that was the last one". Returning here cost a model call after every
       * goodbye, paid for by the house, whose answer the turn then threw away
       * (and cut off mid-request, which the server logged as a 500). A call
       * that never completes is never continued. Pinned in
       * `chat-client-finish.test.ts`; the settle loop sees `finished`, stops
       * the client and disposes of it, promise and all.
       */
      return new Promise<never>(() => {});
    }),
    explainAppTool.client(async () => runExplainApp()),
  );
}

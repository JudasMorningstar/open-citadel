import { useEffect } from 'react';

import { usePodcastPrefs } from '@/stores/podcast-prefs';

const KEYS = { podcasts: 'podcastsContinue', blogs: 'blogsContinue' } as const;

/**
 * Whether a side's placeholder should draw the Continue card: whether the
 * side had one the last time it was read.
 *
 * The placeholder is drawn before the side's library has been read, so it
 * cannot know. What it can know is what was there last time, which is right
 * unless the last thing part-finished was finished since. `hasContinue` is the
 * answer once the library is read (undefined until then), and is kept for the
 * next opening.
 */
export function useContinueHint(side: keyof typeof KEYS, hasContinue: boolean | undefined): boolean {
  const key = KEYS[side];
  const hint = usePodcastPrefs((s) => s[key]);

  useEffect(() => {
    if (hasContinue === undefined || hasContinue === hint) return;
    usePodcastPrefs.getState().set(key, hasContinue);
  }, [hasContinue, hint, key]);

  return hint;
}

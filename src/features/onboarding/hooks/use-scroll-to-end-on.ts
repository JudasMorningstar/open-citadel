import React from 'react';

import { useMessageScroller } from '@/components/ui/message-scroller';

/**
 * Scrolls the transcript to its end whenever `key` changes to something, and
 * leaves it where it is while `key` is null.
 *
 * The scroller on its own follows only while it believes the reader is at the
 * bottom, which is right for a chat somebody is browsing. In onboarding every
 * new message, and every question for the reader, is the next step, and one
 * that lands below the fold is a step nobody sees. A cloud reply that arrives
 * whole grows the transcript in one jump rather than a line at a time, and
 * that is where replies went missing.
 *
 * A frame late, so the new content has been laid out before the scroll
 * measures it. `scrollToEnd` also turns following back on, so the reply laying
 * itself out after the jump is followed too.
 */
export function useScrollToEndOn(key: string | null) {
  const { scrollToEnd } = useMessageScroller();
  React.useEffect(() => {
    if (key === null) return;
    const frame = requestAnimationFrame(() => scrollToEnd(true));
    return () => cancelAnimationFrame(frame);
  }, [key, scrollToEnd]);
}

/**
 * One thing at a time: what Samwell says, then what he does.
 *
 * A turn with tools in it is several things arriving close together: a line
 * of narration, a tool's status row, an approval card, another line. Put on
 * screen as they arrived, the card appeared while the words above it were
 * still being revealed, and the two competed for the eye. This queues each
 * one behind the reveal, so every line has finished arriving before the next
 * thing appears.
 *
 * And, where the surface wants it (`onPart`), each stretch of his reply
 * between two tool calls becomes its own message rather than one bubble that
 * grows three times over. A stretch is handed over once it has been revealed
 * in full and a tool call has closed it, which is also when it can no longer
 * change.
 */
import type { UIMessage } from '@tanstack/ai-client';

import type { SmoothReveal } from '@/services/smooth-reveal';

/**
 * His reply since the reader last spoke, split at every tool call. The last
 * entry is the stretch still being written, and may be empty.
 */
export function replySegments(messages: UIMessage[]): string[] {
  let start = messages.length;
  while (start > 0 && messages[start - 1]?.role !== 'user') start -= 1;

  const segments: string[] = [];
  let current: string[] = [];
  for (const message of messages.slice(start)) {
    if (message.role !== 'assistant') continue;
    let text = '';
    const close = () => {
      if (text.trim()) current.push(text.trim());
      text = '';
    };
    for (const part of message.parts) {
      if (part.type === 'text') text += part.content;
      else if (part.type === 'tool-call') {
        close();
        segments.push(current.join('\n\n'));
        current = [];
      }
    }
    close();
  }
  segments.push(current.join('\n\n'));
  return segments;
}

export type ReplySequence = {
  /** The reply so far, as `replySegments` returns it. */
  update: (segments: string[]) => void;
  /** Runs `work` once everything before it has been shown. */
  then: (work: () => void) => void;
  /** Resolves once everything queued has run and the reveal has settled. */
  idle: () => Promise<void>;
  /** The stretch being written now. */
  current: () => string;
};

export function createReplySequence({
  reveal,
  onPart,
}: {
  reveal: SmoothReveal;
  /** A finished stretch, to keep as its own message. Without it, one bubble. */
  onPart?: (text: string) => void;
}): ReplySequence {
  let chain = Promise.resolve();
  let pending = 0;
  let handed = 0;
  let current = '';

  const run = (work: () => Promise<void>) => {
    pending += 1;
    chain = chain
      .then(work)
      .catch((error: unknown) => {
        if (__DEV__) console.warn('[Samwell] Reply step failed:', error);
      })
      .finally(() => {
        pending -= 1;
        // The line being written was held while earlier ones finished.
        if (pending === 0) reveal.push(current);
      });
  };

  return {
    update(segments) {
      if (onPart) {
        while (handed < segments.length - 1) {
          const text = segments[handed] ?? '';
          handed += 1;
          if (!text) continue;
          run(async () => {
            reveal.push(text);
            await reveal.settle();
            onPart(text);
          });
        }
        current = segments.at(-1) ?? '';
      } else {
        current = segments.filter(Boolean).join('\n\n');
      }
      if (pending === 0) reveal.push(current);
    },
    then(work) {
      run(async () => {
        await reveal.settle();
        work();
      });
    },
    async idle() {
      let seen: Promise<void>;
      do {
        seen = chain;
        await seen;
      } while (seen !== chain);
      await reveal.settle();
    },
    current: () => current,
  };
}

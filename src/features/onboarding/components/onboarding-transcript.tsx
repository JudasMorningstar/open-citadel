import React from 'react';

import { ChatBubble } from '@/components/chat/chat-bubble';
import { TranscriptFade } from '@/components/scroll-fades';
import { MessageScroller } from '@/components/ui/message-scroller';
import { TurnStatus } from '@/features/chat/components/turn-status';
import type { TurnIndicator } from '@/features/chat/utils/agent-activity';
import { transcriptContent } from '@/features/chat/utils/transcript-layout';
import { OnboardingApprovalCard } from '@/features/onboarding/components/onboarding-approval-card';
import { useScrollToEndOn } from '@/features/onboarding/hooks/use-scroll-to-end-on';
import { isVisibleChatMessage } from '@/services/chat-transcript';
import type { ChatMessage } from '@/services/chat-sessions';

/**
 * Brings each new turn into view: a message, or the start of a reply. The
 * approval card does the same for a question. See `useScrollToEndOn`.
 */
function FollowNewTurns({ turnKey }: { turnKey: string | null }) {
  useScrollToEndOn(turnKey);
  return null;
}

/**
 * The onboarding conversation on screen.
 *
 * Built from the same pieces the other two transcripts are — the scroller, the
 * bubble, the one live status row — rather than reusing `ChatTranscript`. That
 * component's props are shaped around reading chat: a readiness banner, an
 * empty state offering to wake the on-device engine, a book picker, three
 * navigation callbacks. None of it applies here, and threading a fourth mode
 * through it would make it worse for the two surfaces that do need those
 * things.
 *
 * One thing here that the other transcripts do not have: the approval card.
 * Elsewhere an approval is a modal mounted above the navigator, which reads as
 * an interruption because elsewhere it IS one. Here the conversation is the
 * whole screen and the question is simply the next thing Samwell said, so it
 * belongs in the thread. See `OnboardingApprovalCard`.
 *
 * The bubbles carry no navigation callbacks, and that is not an omission.
 * Samwell emits no reference markers in this conversation: he has never seen a
 * highlight of theirs, and until the last minute of it there are no books in
 * the library to link to. There is nowhere for a tap to go.
 */
export function OnboardingTranscript({
  sessionId,
  messages,
  streamingReply,
  indicator,
  lastStreamedMessageId,
}: {
  /** The scroller is keyed on it, so a resumed session opens where it was. */
  sessionId: string | null;
  messages: ChatMessage[];
  streamingReply: string;
  indicator: TurnIndicator | null;
  /** Already on screen as the streaming bubble, so it arrives without an
   *  entrance animation. */
  lastStreamedMessageId: string | null;
}) {
  /*
   * The setup notes are a system message, and system messages are not bubbles.
   *
   * They are persisted into the transcript so the conversation resumes with
   * everything Samwell needs after an app kill, which means they come straight
   * back out of `readMessages` alongside what was actually said. Without this
   * filter the reader's first sight of Open Citadel is a paragraph of
   * instructions written about them in the third person.
   *
   * Memoized because a streaming reply re-renders this component on every
   * token, and an unmemoized filter would hand the list a new array each time.
   */
  const turns = React.useMemo(() => messages.filter(isVisibleChatMessage), [messages]);
  const lastId = turns.at(-1)?.id ?? null;
  const replying = streamingReply.length > 0;
  const turnKey = lastId || replying ? `${lastId}:${replying}` : null;

  return (
    <MessageScroller key={sessionId ?? 'onboarding'} autoScroll className="flex-1">
      {/* `start` only: unlike the hub's transcripts nothing floats over this
          one, so the bottom is an edge content stops at rather than passes
          behind. Same call `app/chat/[id]` makes for the same reason. */}
      <TranscriptFade edges="start">
        <MessageScroller.Viewport>
          <MessageScroller.Content style={transcriptContent}>
            {turns.map((message) => (
              <MessageScroller.Item
                key={message.id}
                messageId={message.id}
                // The reader's own turns are what a thread is navigated by.
                scrollAnchor={message.role === 'user'}
              >
                <ChatBubble
                  role={message.role as 'user' | 'assistant'}
                  content={message.content}
                  animateEntry={message.id !== lastStreamedMessageId}
                />
              </MessageScroller.Item>
            ))}

            {streamingReply.length > 0 && (
              // Each part of his reply is its own bubble, and each fades up as
              // it starts rather than appearing whole-sized from nowhere.
              <ChatBubble role="assistant" content={streamingReply} streaming animateEntry />
            )}

            <TurnStatus indicator={indicator} />

            {/* Under the status row, because the status row is what says he is
                waiting and this is what the waiting is for. The scroller is on
                `autoScroll`, so a question arriving mid-turn brings itself into
                view rather than appearing below the fold. */}
            <OnboardingApprovalCard sessionId={sessionId} />
          </MessageScroller.Content>
        </MessageScroller.Viewport>
      </TranscriptFade>
      <MessageScroller.Button />
      <FollowNewTurns turnKey={turnKey} />
    </MessageScroller>
  );
}

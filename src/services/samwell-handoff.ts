/**
 * Starting a chat with Samwell from elsewhere in the app.
 *
 * A chat about something in the Library happens on the hub's Samwell page,
 * the same page and the same composer as every other chat, with the thing
 * asked about waiting as the chat's book until the first message makes the
 * conversation (`useChatSessions.send`). That is how picking a book on the
 * page already works; this lets a post's menu do the same from outside it.
 */
import type { BookKind } from '@/db/schema';
import { scheduleBackgroundTitles, useChatStore } from '@/stores/chat';
import { HUB, useHubStore } from '@/stores/hub';
import { useSamwellSessionStore } from '@/stores/samwell-session';

/**
 * Leaves the chat on the page for a fresh one: stops a reply in flight,
 * waits out a rename, and clears every turn-local field so a stopped
 * generation cannot leave the page locked while its native promise unwinds.
 */
export async function leaveForNewChat(): Promise<void> {
  const chat = useChatStore.getState();
  if (chat.isGenerating) chat.stopGeneration();
  // A rename started from the history sheet may still be generating.
  await chat.waitForRetitle();
  useChatStore.setState({
    activeSession: null,
    messages: [],
    isGenerating: false,
    isThinking: false,
    isToolCalling: false,
    toolCallStatus: null,
    toolCallName: null,
    streamingContent: '',
    thinkingContent: '',
    thinkingSeconds: null,
    lastStreamedMessageId: null,
    deviceLimit: null,
    queuedBehindTitle: false,
  });
  // The chat just left may still be called "New chat" on device.
  scheduleBackgroundTitles();
}

/**
 * A new chat about one book or post, on the Samwell page. The caller leaves
 * any screen stacked above the hub; the pager honours the page asked for
 * when the hub comes back into view.
 */
export async function askSamwellAbout(book: { id: string; title: string; kind: BookKind }): Promise<void> {
  await leaveForNewChat();
  useSamwellSessionStore.getState().set({ pendingBook: book, mode: 'chat' });
  useHubStore.getState().goTo(HUB.samwell);
}

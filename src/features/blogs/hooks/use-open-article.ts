import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';

import { ExternalLink } from '@/components/icons';
import { dismissToast, showToast } from '@/components/toast/toast-provider';
import { invalidateBlogLibrary } from '@/query-manager/blogs';
import { openArticleBook } from '@/services/blogs/article-book';
import type { ArticleItem } from '@/services/blogs/records';
import { useChatStore } from '@/stores/chat';

const TOAST_KEY = 'open-article';
/** Opening usually takes a moment; a toast only for a wait long enough to notice. */
const BUSY_AFTER_MS = 400;

type OpenablePost = Pick<ArticleItem, 'id' | 'title' | 'link'>;

/** Only one post opens at a time: a second tap while one is getting ready does nothing. */
let opening = false;

/**
 * Runs `work` for a post, saying so in a toast if it takes long enough to
 * notice, and offering the original on the web if it fails.
 */
async function withPost<T>(post: OpenablePost, work: () => Promise<T>): Promise<T | null> {
  if (opening) return null;
  opening = true;
  const busy = setTimeout(() => showToast({ key: TOAST_KEY, message: 'Getting the post ready', busy: true }), BUSY_AFTER_MS);
  try {
    const result = await work();
    dismissToast(TOAST_KEY);
    // Opening marks the post read; the list learns of it on the way back
    // (`useArticleActions`), not on the frame the reader starts to slide in.
    return result;
  } catch (err) {
    // A chat that failed after the post's copy was made still changed it.
    invalidateBlogLibrary();
    showToast({
      key: TOAST_KEY,
      message: err instanceof Error ? err.message : 'This post could not be opened.',
      actionIcon: ExternalLink,
      actionLabel: 'Open the original',
      onActionPress: () => void WebBrowser.openBrowserAsync(post.link).catch(() => {}),
    });
    return null;
  } finally {
    clearTimeout(busy);
    opening = false;
  }
}

/**
 * Opening a post in the reader, and starting a chat with Samwell about one.
 * Both make the post's reader copy first (see `openArticleBook`), so a chat
 * started from a list is grounded in the post, and the post it names is one
 * tap from the chat.
 */
export function useOpenArticle() {
  const router = useRouter();

  const openArticle = React.useCallback(
    async (post: OpenablePost) => {
      const bookId = await withPost(post, () => openArticleBook(post.id));
      if (bookId) router.push({ pathname: '/reader/[id]', params: { id: bookId } });
    },
    [router],
  );

  const chatAboutArticle = React.useCallback(
    async (post: OpenablePost) => {
      const sessionId = await withPost(post, async () => {
        const bookId = await openArticleBook(post.id);
        return useChatStore.getState().createSession({ bookId, title: post.title.slice(0, 60) });
      });
      if (sessionId) router.push({ pathname: '/chat/[id]', params: { id: sessionId } });
    },
    [router],
  );

  return { openArticle, chatAboutArticle };
}

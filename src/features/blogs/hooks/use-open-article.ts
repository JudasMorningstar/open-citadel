import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';

import { ExternalLink } from '@/components/icons';
import { dismissToast, showToast } from '@/components/toast/toast-provider';
import { invalidateBlogLibrary } from '@/query-manager/blogs';
import { openArticleBook } from '@/services/blogs/article-book';
import type { ArticleItem } from '@/services/blogs/records';
import { askSamwellAbout } from '@/services/samwell-handoff';

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
    // A failure after the post's copy was made still changed it.
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
 * Both make the post's reader copy first (see `openArticleBook`): a chat
 * about a post is grounded in that copy's text.
 */
export function useOpenArticle() {
  const router = useRouter();

  /** The post's reader copy, made if need be; its book id, or null if it failed (said in a toast). */
  const prepareArticle = React.useCallback(
    (post: OpenablePost) => withPost(post, () => openArticleBook(post.id)),
    [],
  );

  const openArticle = React.useCallback(
    async (post: OpenablePost) => {
      const bookId = await prepareArticle(post);
      if (bookId) router.push({ pathname: '/reader/[id]', params: { id: bookId } });
    },
    [prepareArticle, router],
  );

  // On the Samwell page, as any chat is, with the post waiting as its book.
  // From a screen above the hub (a blog's page, a shelf's), back down to it.
  const chatAboutArticle = React.useCallback(
    async (post: OpenablePost) => {
      const bookId = await prepareArticle(post);
      if (!bookId) return;
      await askSamwellAbout({ id: bookId, title: post.title, kind: 'article' });
      if (router.canDismiss()) router.dismissTo('/');
    },
    [prepareArticle, router],
  );

  return { prepareArticle, openArticle, chatAboutArticle };
}

import type { MenuRow } from '@/components/menu-list';
import type { ArticleItem } from '@/services/blogs/records';

export type ArticleAction =
  | 'open'
  | 'chat'
  | 'favorite'
  | 'unfavorite'
  | 'queue'
  | 'dequeue'
  | 'finish'
  | 'unfinish'
  | 'read'
  | 'unread'
  | 'original'
  | 'share'
  | 'blog';

type ArticleMenuOptions = {
  /** Off on the blog's own page, where going to the blog goes nowhere. */
  blogLink: boolean;
};

type MenuArticle = Pick<ArticleItem, 'savedAt' | 'favoritedAt' | 'finishedAt' | 'readAt'>;

/**
 * What can be done to a post in the state it is in, in menu order. The
 * favorites, queue and finished rows read as a book's do (`bookMenu`), so a
 * post and a book kept in the same Library are kept in the same words.
 */
export function articleMenu(article: MenuArticle, options: ArticleMenuOptions): MenuRow<ArticleAction>[] {
  const finished = article.finishedAt !== null;
  const rows: MenuRow<ArticleAction>[] = [
    { key: 'open', label: 'Read' },
    { key: 'chat', label: 'Ask Samwell About This', tone: 'gold' },
    article.favoritedAt
      ? { key: 'unfavorite', label: 'Remove from Favorites' }
      : { key: 'favorite', label: 'Add to Favorites' },
  ];
  // A finished post is off the queue, as a finished book is.
  if (article.savedAt) rows.push({ key: 'dequeue', label: 'Remove from Queue' });
  else if (!finished) rows.push({ key: 'queue', label: 'Add to Queue' });
  rows.push(
    finished
      ? { key: 'unfinish', label: 'Mark as Unfinished', tone: 'muted' }
      : { key: 'finish', label: 'Mark as Finished', tone: 'gold' },
    article.readAt ? { key: 'unread', label: 'Mark as Unread' } : { key: 'read', label: 'Mark as Read' },
    { key: 'original', label: 'Open the Original' },
    { key: 'share', label: 'Share' },
  );
  if (options.blogLink) rows.push({ key: 'blog', label: 'Go to Blog' });
  return rows;
}

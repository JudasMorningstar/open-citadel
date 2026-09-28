import type { MenuRow } from '@/components/menu-list';
import type { ArticleItem } from '@/services/blogs/records';

export type ArticleAction = 'open' | 'chat' | 'save' | 'unsave' | 'read' | 'unread' | 'original' | 'share' | 'blog';

type ArticleMenuOptions = {
  /** Off on the blog's own page, where going to the blog goes nowhere. */
  blogLink: boolean;
};

/** What can be done to a post in the state it is in, in menu order. */
export function articleMenu(article: Pick<ArticleItem, 'savedAt' | 'readAt'>, options: ArticleMenuOptions): MenuRow<ArticleAction>[] {
  const rows: MenuRow<ArticleAction>[] = [
    { key: 'open', label: 'Read' },
    { key: 'chat', label: 'Ask Samwell About This', tone: 'gold' },
    article.savedAt ? { key: 'unsave', label: 'Remove from Saved', tone: 'muted' } : { key: 'save', label: 'Save for Later' },
    article.readAt ? { key: 'unread', label: 'Mark as Unread' } : { key: 'read', label: 'Mark as Read' },
    { key: 'original', label: 'Open the Original' },
    { key: 'share', label: 'Share' },
  ];
  if (options.blogLink) rows.push({ key: 'blog', label: 'Go to Blog' });
  return rows;
}

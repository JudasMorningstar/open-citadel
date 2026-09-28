import type { MenuRow } from '@/components/menu-list';
import type { Book } from '@/stores/books';

export type BookMenuAction =
  | 'open'
  | 'favorite'
  | 'unfavorite'
  | 'collection'
  | 'stop-reading'
  | 'queue'
  | 'dequeue'
  | 'finish'
  | 'unfinish'
  | 'rename'
  | 'delete';

type BookMenuOptions = { collections: boolean; rename: boolean; delete: boolean };

/** What can be done to a book in the state it is in, in menu order. */
export function bookMenu(book: Book, options: BookMenuOptions): MenuRow<BookMenuAction>[] {
  const archived = book.status === 'archived';
  const queued = book.status === 'queued';
  const rows: MenuRow<BookMenuAction>[] = [{ key: 'open', label: 'Open' }];
  rows.push(
    book.isFavorite === 1
      ? { key: 'unfavorite', label: 'Remove from Favorites' }
      : { key: 'favorite', label: 'Add to Favorites' },
  );
  if (options.collections) rows.push({ key: 'collection', label: 'Add to Collection' });
  if (book.status === 'reading') rows.push({ key: 'stop-reading', label: 'Remove from Currently Reading' });
  if (!queued && !archived) rows.push({ key: 'queue', label: 'Add to Queue' });
  if (queued) rows.push({ key: 'dequeue', label: 'Remove from Queue' });
  rows.push(
    archived
      ? { key: 'unfinish', label: 'Mark as Unfinished', tone: 'muted' }
      : { key: 'finish', label: 'Mark as Finished', tone: 'gold' },
  );
  if (options.rename) rows.push({ key: 'rename', label: 'Edit Title' });
  if (options.delete) rows.push({ key: 'delete', label: 'Delete Book', tone: 'destructive' });
  return rows;
}

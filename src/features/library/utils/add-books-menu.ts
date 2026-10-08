export type AddBooksKey = 'files' | 'free';

export type AddBooksOption = { key: AddBooksKey; label: string };

/**
 * What the Library's add button offers.
 *
 * iOS copies EPUBs in with the document picker, so it has two ways in. On
 * Android books arrive through the chosen folder and there is nothing to
 * pick, so the button goes straight to the free books.
 */
export function addBooksMenu(platform: string | undefined): AddBooksOption[] {
  const free: AddBooksOption = { key: 'free', label: 'Find free books' };
  return platform === 'ios' ? [{ key: 'files', label: 'Add from Files' }, free] : [free];
}

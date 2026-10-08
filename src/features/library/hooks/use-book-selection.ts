import React from 'react';

/**
 * Which books are ticked in the Add Books sheet, seeded with the collection's
 * own books each time the sheet opens.
 *
 * Seeded on the edge where the sheet opens, and only there. It was an effect
 * keyed on `visible` AND `existingIds`, and the caller built that array
 * inline, so any store write while the sheet was open re-ran it and threw the
 * reader's ticks away mid-edit (a sync finishing was enough). Opening is the
 * only moment the existing membership is the right answer. setState during
 * render for a prop change is React's sanctioned reset and does not cascade.
 */
export function useBookSelection(visible: boolean, existingIds: string[]) {
  const [selected, setSelected] = React.useState<Set<string>>(() => (visible ? new Set(existingIds) : new Set()));
  const [wasVisible, setWasVisible] = React.useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setSelected(new Set(existingIds));
  }

  const toggle = React.useCallback((bookId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(bookId)) next.delete(bookId);
      else next.add(bookId);
      return next;
    });
  }, []);

  const added = [...selected].filter((id) => !existingIds.includes(id)).length;
  return { selected, toggle, added };
}

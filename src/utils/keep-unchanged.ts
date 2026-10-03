import { replaceEqualDeep } from '@tanstack/react-query';

/**
 * A fresh read of the same rows, handed back as the objects already held.
 *
 * Every reload of a store (coming back to the hub re-reads books, collections
 * and the Timeline) returns new objects from SQLite even when nothing changed.
 * A new object is a new prop: every shelf, every card and anything else
 * subscribed to the list re-rendered on each return to the hub, to draw
 * exactly what was already there, in the moment the reader lands and wants to
 * tap something.
 *
 * This keeps whatever is deep-equal by identity (TanStack Query's structural
 * sharing, the same thing it does for query data), so an unchanged reload
 * re-renders nothing and a one-row change re-renders that row.
 *
 * Plain JSON-shaped data only: rows, arrays and records of them.
 */
export function keepUnchanged<T>(previous: T, next: T): T {
  return replaceEqualDeep(previous, next);
}

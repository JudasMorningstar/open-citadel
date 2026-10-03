/**
 * How long a side of the Library waits before mounting its heavy content.
 *
 * The switch between sides is a 250ms cross-fade (`ViewSwitcher`), and shelves
 * mounted under a moving surface are what make it stutter, so a side opened
 * through the switch waits the fade out, with a little to spare.
 *
 * The side the app OPENED on has no fade: it is simply there when the splash
 * lifts. Waiting there is a wait for nothing, and a long one in practice,
 * because the timer cannot fire until the launch's other work has let go of
 * the thread.
 */
export const SWITCH_SETTLE_MS = 300;

export function sideSettleMs<K extends string>(side: K, openedOn: K): number {
  return side === openedOn ? 0 : SWITCH_SETTLE_MS;
}

/** What the books side draws: the skeleton, the setup prompt, or the shelves. */
export type BooksLibraryView = 'booting' | 'setup' | 'library';

/**
 * Which of the three the books side shows.
 *
 * The skeleton holds until both things are true: the library has been read
 * (`booted`, so "no data yet" is never drawn as "not set up") and the side has
 * stopped moving (`landed`, so the shelves never mount mid-fade).
 */
export function booksLibraryView(state: { booted: boolean; landed: boolean; needsSetup: boolean }): BooksLibraryView {
  if (!state.booted || !state.landed) return 'booting';
  return state.needsSetup ? 'setup' : 'library';
}

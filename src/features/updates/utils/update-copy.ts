/**
 * Where an update that has been downloaded stands.
 *
 * `ready` is waiting for the press, `restarting` is the moment after it, and
 * `failed` is a restart the phone refused.
 */
export type UpdatePhase = 'ready' | 'restarting' | 'failed';

export type UpdateCopy = {
  title: string;
  /** The one line under the title. */
  line: string;
  /** The gold button. */
  action: string;
  /** The quieter way out, drawn only when there is one. */
  wayOut: string | null;
};

const READY: UpdateCopy = {
  title: 'App update',
  line: 'A new version of Open Citadel is ready.',
  action: 'UPDATE NOW',
  wayOut: null,
};

/**
 * A restart that fails is the one time the dialog can be left. The update is
 * already on the phone and loads the next time the app opens from closed, so
 * holding someone on a button that does not work would be a dead end with
 * nothing gained.
 */
const FAILED: UpdateCopy = {
  title: "Couldn't restart",
  line: 'The update will load the next time you open Open Citadel.',
  action: 'TRY AGAIN',
  wayOut: 'NOT NOW',
};

/** What the update dialog says in each phase. */
export function updateCopy(phase: UpdatePhase): UpdateCopy {
  return phase === 'failed' ? FAILED : READY;
}

/** The chip that stands for the notes held back. */
export function moreLabel(more: number): string {
  return `+ ${more} more`;
}

/** The same chip, said aloud: what pressing it does. */
export function moreSpoken(more: number): string {
  return more === 1 ? 'Show 1 more change' : `Show ${more} more changes`;
}

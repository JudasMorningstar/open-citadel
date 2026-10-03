/**
 * A note left on disk while the on-device model is doing something that can
 * get the app killed, so the next launch can tell that it was.
 *
 * Android kills an app that runs out of memory with no warning and no
 * exception: the reader sees the app vanish, and the app, started again,
 * knows nothing about it. A marker written before the work and cleared after
 * it is the only trace the app can leave itself. Found still set, the work
 * never finished.
 *
 * It also stays set when the reader swipes the app away mid-reply, which is
 * why what is said about it (`interruptedMessage`) blames nothing outright.
 */

import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { appSettings } from '@/db/schema';

const KEY = 'device.runInFlight';

/** Call before loading a brain or starting a turn on it. */
export function markRunStarted(modelId: string): void {
  db.insert(appSettings)
    .values({ key: KEY, value: modelId })
    .onConflictDoUpdate({ target: appSettings.key, set: { value: modelId } })
    .run();
}

/** Call when the load or the turn ends, however it ends. */
export function markRunFinished(): void {
  db.delete(appSettings).where(eq(appSettings.key, KEY)).run();
}

/**
 * The brain whose last run never finished, or null. Reading it clears it, so
 * the reader is told once.
 */
export function takeInterruptedRun(): string | null {
  const row = db.select().from(appSettings).where(eq(appSettings.key, KEY)).get();
  if (!row) return null;
  markRunFinished();
  return row.value;
}

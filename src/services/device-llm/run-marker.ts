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
 * It also stays set when the reader swipes the app away mid-reply, or when
 * the app crashes for a reason of its own. The marker says only that a run
 * was cut short and when: what cut it short is read from Android's own record
 * of the death (`memory-verdict.ts`), never assumed.
 */

import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { appSettings } from '@/db/schema';
import { memoryHeldBytes } from '@/lib/exit-info';
import { encodeRunMarker, parseRunMarker, type RunMarker } from '@/services/device-llm/exit-verdict';

const KEY = 'device.runInFlight';

/** Call before loading a brain or starting a turn on it. */
export function markRunStarted(modelId: string): void {
  const value = encodeRunMarker({ model: modelId, startedAt: Date.now(), heldBytes: memoryHeldBytes() });
  db.insert(appSettings)
    .values({ key: KEY, value })
    .onConflictDoUpdate({ target: appSettings.key, set: { value } })
    .run();
}

/** Call when the load or the turn ends, however it ends. */
export function markRunFinished(): void {
  db.delete(appSettings).where(eq(appSettings.key, KEY)).run();
}

/**
 * The run that never finished, or null. Reading it clears it, so it is
 * judged once.
 */
export function takeInterruptedRun(): RunMarker | null {
  const row = db.select().from(appSettings).where(eq(appSettings.key, KEY)).get();
  if (!row) return null;
  markRunFinished();
  return parseRunMarker(row.value);
}

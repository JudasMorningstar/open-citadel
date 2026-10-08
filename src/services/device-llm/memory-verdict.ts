/**
 * Which brains this phone has ended the app over, kept on disk, and the
 * judging of a run that never finished.
 *
 * A verdict is only ever written from Android's record of the death
 * (`exit-verdict.ts`): the phone killed the app to take its memory back. A
 * crash writes none, and is kept apart as the last fault so it can be looked
 * into. The reader can lift a verdict and try the brain again, since what the
 * phone can spare changes with what else is open.
 */

import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { appSettings } from '@/db/schema';
import { lastExits } from '@/lib/exit-info';
import {
  faultLabel,
  judgeRun,
  parseVerdicts,
  type MemoryVerdict,
  type RunMarker,
  type RunOutcome,
} from '@/services/device-llm/exit-verdict';

const VERDICTS_KEY = 'device.memoryVerdicts';
const FAULT_KEY = 'device.lastFault';

function save(key: string, value: string): void {
  db.insert(appSettings).values({ key, value }).onConflictDoUpdate({ target: appSettings.key, set: { value } }).run();
}

/** Every verdict on record, by brain id. */
export function loadVerdicts(): Record<string, MemoryVerdict> {
  const row = db.select().from(appSettings).where(eq(appSettings.key, VERDICTS_KEY)).get();
  return parseVerdicts(row?.value);
}

/** Lifts a brain's verdict, so it can be woken again. Returns what is left. */
export function clearVerdict(modelId: string): Record<string, MemoryVerdict> {
  const verdicts = loadVerdicts();
  delete verdicts[modelId];
  save(VERDICTS_KEY, JSON.stringify(verdicts));
  return verdicts;
}

/**
 * Judges a run that never finished and keeps what it came to: a verdict
 * against the brain when the phone ended the app for memory, the details when
 * the app faulted, nothing otherwise.
 */
export function settleInterruptedRun(marker: RunMarker): RunOutcome {
  const outcome = judgeRun(marker, lastExits());
  if (outcome.cause === 'memory') {
    save(VERDICTS_KEY, JSON.stringify({ ...loadVerdicts(), [marker.model]: outcome.verdict }));
  } else if (outcome.cause === 'fault') {
    const { exit } = outcome;
    save(FAULT_KEY, JSON.stringify({ model: marker.model, ...exit }));
    console.warn(`[device-llm] ${marker.model} ended in ${faultLabel(exit)} (reason ${exit.reason}, status ${exit.status})`);
  }
  return outcome;
}

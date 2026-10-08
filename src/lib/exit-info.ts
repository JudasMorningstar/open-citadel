/**
 * Why the app's process last died, and how much memory it holds now, from the
 * local `ExitInfo` native module (`modules/exit-info`, Android only).
 *
 * Null answers everywhere it is missing: iOS, the web, Android before 11, and
 * any dev build made before the module was added.
 */

import { requireOptionalNativeModule } from 'expo';

import type { ExitRecord } from '@/services/device-llm/exit-verdict';

interface ExitInfoModule {
  lastExits(max: number): ExitRecord[];
  heldBytes(): number;
}

let resolved: ExitInfoModule | null | undefined;

function exitInfo(): ExitInfoModule | null {
  if (resolved === undefined) resolved = requireOptionalNativeModule<ExitInfoModule>('ExitInfo');
  return resolved;
}

/** The app's most recent deaths as Android recorded them, newest first, or null when it cannot be asked. */
export function lastExits(max = 8): ExitRecord[] | null {
  try {
    return exitInfo()?.lastExits(max) ?? null;
  } catch {
    return null;
  }
}

/** What the app holds in memory right now, in RAM and swapped out together, or null when it cannot be read. */
export function memoryHeldBytes(): number | null {
  try {
    return exitInfo()?.heldBytes() || null;
  } catch {
    return null;
  }
}

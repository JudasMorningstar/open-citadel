/**
 * What ended a run of the on-device model, judged from the record Android
 * keeps of the app's death rather than guessed.
 *
 * Nothing reaches the app before it is killed for memory: no exception, no
 * error from the runtime, no last callback. Measured on a Galaxy A33 with
 * Gemma 4 E2B, the same failure was recorded two ways on two runs:
 *
 * - `LOW_MEMORY`: Android's low-memory killer, after it had killed 58 other
 *   processes first, thirteen seconds into the first reply.
 * - `SIGNALED` with signal 9: Samsung's own watchdog, which ends any app
 *   holding more than about 3 GB (`Heimdall: Trigger Global kill`).
 *
 * A real crash is recorded differently (`CRASH`, `CRASH_NATIVE`, `ANR`), and
 * that difference is the point: only a death the phone chose is held against
 * the brain's size. A fault is ours to find, and blaming memory would hide it.
 */

/** One death of the app's process, as `ApplicationExitInfo` has it. */
export interface ExitRecord {
  /** When it died, in milliseconds since the epoch. */
  timestamp: number;
  reason: number;
  /** The signal for a signalled death, the exit code otherwise. */
  status: number;
  /** What was in RAM at the end. Not what the app held: a pressed phone has most of that swapped out. */
  rssBytes: number;
  pssBytes: number;
  description: string | null;
}

/** `ApplicationExitInfo`'s reasons, the ones told apart here. */
const REASON = {
  UNKNOWN: 0,
  SIGNALED: 2,
  LOW_MEMORY: 3,
  CRASH: 4,
  CRASH_NATIVE: 5,
  ANR: 6,
  INITIALIZATION_FAILURE: 7,
  EXCESSIVE_RESOURCE_USAGE: 9,
} as const;

const SIGKILL = 9;

export type ExitCause =
  /** The phone ended the app to get its memory back. */
  | 'memory'
  /** The app broke: a crash or a hang. Not the brain's size, and worth a look. */
  | 'fault'
  /** Closed on purpose: swiped away, stopped, updated. Nothing to explain. */
  | 'closed'
  /** No record to judge by. */
  | 'unknown';

export function exitCause(exit: ExitRecord | null): ExitCause {
  if (!exit || exit.reason === REASON.UNKNOWN) return 'unknown';
  switch (exit.reason) {
    case REASON.LOW_MEMORY:
    case REASON.EXCESSIVE_RESOURCE_USAGE:
      return 'memory';
    case REASON.SIGNALED:
      // Killed from outside is the system reclaiming memory: a maker's own
      // watchdog, or the low-memory killer on a phone that does not report
      // it as such. Any other signal is the app's own doing.
      return exit.status === SIGKILL ? 'memory' : 'fault';
    case REASON.CRASH:
    case REASON.CRASH_NATIVE:
    case REASON.ANR:
    case REASON.INITIALIZATION_FAILURE:
      return 'fault';
    default:
      return 'closed';
  }
}

/** What kind of fault, in a few words, for whoever looks into it. */
export function faultLabel(exit: ExitRecord): string {
  if (exit.reason === REASON.ANR) return 'the app stopped responding';
  if (exit.reason === REASON.CRASH) return 'a crash in the app';
  if (exit.reason === REASON.INITIALIZATION_FAILURE) return 'the app failed to start';
  return `a native crash, signal ${exit.status}`;
}

/**
 * The death that ended a run begun at `startedAt`: the first one at or after
 * it. `exits` is newest first, as Android hands it over.
 */
export function exitThatEnded(exits: readonly ExitRecord[], startedAt: number): ExitRecord | null {
  let ended: ExitRecord | null = null;
  for (const exit of exits) {
    if (exit.timestamp >= startedAt) ended = exit;
  }
  return ended;
}

/** The note left while a brain is loading or replying (`run-marker.ts`). */
export interface RunMarker {
  model: string;
  /** When the run began, or 0 for a note left by a build that did not say. */
  startedAt: number;
  /** What the app held in memory when the run began, when that could be read. */
  heldBytes: number | null;
}

export function encodeRunMarker(marker: RunMarker): string {
  return JSON.stringify(marker);
}

/** A stored note back as a marker. Older builds stored the brain's id alone. */
export function parseRunMarker(value: string): RunMarker {
  try {
    const parsed: unknown = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && 'model' in parsed && typeof parsed.model === 'string') {
      const { startedAt, heldBytes } = parsed as Partial<RunMarker>;
      return {
        model: parsed.model,
        startedAt: typeof startedAt === 'number' ? startedAt : 0,
        heldBytes: typeof heldBytes === 'number' ? heldBytes : null,
      };
    }
  } catch {
    // Not JSON: the older, bare form.
  }
  return { model: value, startedAt: 0, heldBytes: null };
}

/** That the phone ended the app while this brain ran, kept so he is not woken into the same end again. */
export interface MemoryVerdict {
  /** When the app died. */
  at: number;
  /** The most the app was seen holding during that run, in bytes, or null when nothing was read. */
  heldBytes: number | null;
}

/** What a run that never finished came to. */
export type RunOutcome =
  | { cause: 'memory'; verdict: MemoryVerdict }
  | { cause: 'fault'; exit: ExitRecord }
  | { cause: 'closed' | 'unknown' };

/**
 * Judges an unfinished run against the app's recorded deaths. `exits` is null
 * when the record cannot be read at all (iOS, an older Android, an older
 * build).
 */
export function judgeRun(marker: RunMarker, exits: readonly ExitRecord[] | null): RunOutcome {
  // A note from a build that did not say when the run began can only be
  // paired with the latest death.
  const exit = !exits ? null : marker.startedAt > 0 ? exitThatEnded(exits, marker.startedAt) : (exits[0] ?? null);
  const cause = exitCause(exit);
  if (!exit || cause === 'unknown' || cause === 'closed') return { cause: cause === 'closed' ? 'closed' : 'unknown' };
  if (cause === 'fault') return { cause, exit };

  const seen = Math.max(marker.heldBytes ?? 0, exit.rssBytes);
  return { cause, verdict: { at: exit.timestamp, heldBytes: seen > 0 ? seen : null } };
}

/** Stored verdicts back as a map of brain id to verdict. Anything malformed is dropped. */
export function parseVerdicts(value: string | null | undefined): Record<string, MemoryVerdict> {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object') return {};
    const verdicts: Record<string, MemoryVerdict> = {};
    for (const [model, entry] of Object.entries(parsed)) {
      if (!entry || typeof entry !== 'object') continue;
      const { at, heldBytes } = entry as Partial<MemoryVerdict>;
      if (typeof at !== 'number') continue;
      verdicts[model] = { at, heldBytes: typeof heldBytes === 'number' ? heldBytes : null };
    }
    return verdicts;
  } catch {
    return {};
  }
}

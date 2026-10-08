import { describe, expect, it } from 'vitest';

import {
  encodeRunMarker,
  exitCause,
  exitThatEnded,
  faultLabel,
  judgeRun,
  parseRunMarker,
  parseVerdicts,
  type ExitRecord,
} from '@/services/device-llm/exit-verdict';

const GB = 1024 ** 3;

const exit = (reason: number, status: number, timestamp = 2000, rssBytes = 0): ExitRecord => ({
  timestamp,
  reason,
  status,
  rssBytes,
  pssBytes: 0,
  description: null,
});

// The three deaths recorded on a Galaxy A33 with Gemma 4 E2B, 3-4 Oct 2026.
const LOW_MEMORY = exit(3, 0, 2000, 1.5 * GB);
const WATCHDOG = exit(2, 9, 2000, 0.19 * GB);
const NATIVE_CRASH = exit(5, 11);

describe('exitCause', () => {
  it('counts the low-memory killer as memory', () => {
    expect(exitCause(LOW_MEMORY)).toBe('memory');
  });

  it("counts a kill from outside as memory: a maker's watchdog is recorded as signal 9", () => {
    expect(exitCause(WATCHDOG)).toBe('memory');
  });

  it('counts excessive resource use as memory', () => {
    expect(exitCause(exit(9, 0))).toBe('memory');
  });

  it('counts a crash or a hang as a fault, never as memory', () => {
    expect(exitCause(NATIVE_CRASH)).toBe('fault');
    expect(exitCause(exit(4, 1))).toBe('fault');
    expect(exitCause(exit(6, 0))).toBe('fault');
  });

  it("counts a signal the app raised itself as a fault", () => {
    expect(exitCause(exit(2, 11))).toBe('fault');
  });

  it('counts being closed on purpose as nothing to explain', () => {
    expect(exitCause(exit(10, 0))).toBe('closed');
    expect(exitCause(exit(11, 0))).toBe('closed');
    expect(exitCause(exit(1, 0))).toBe('closed');
  });

  it('does not judge without a record', () => {
    expect(exitCause(null)).toBe('unknown');
    expect(exitCause(exit(0, 0))).toBe('unknown');
  });
});

describe('faultLabel', () => {
  it('names the fault for whoever looks into it', () => {
    expect(faultLabel(NATIVE_CRASH)).toBe('a native crash, signal 11');
    expect(faultLabel(exit(4, 1))).toBe('a crash in the app');
    expect(faultLabel(exit(6, 0))).toBe('the app stopped responding');
  });
});

describe('exitThatEnded', () => {
  it('is the first death after the run began, not the latest one', () => {
    const exits = [exit(10, 0, 9000), exit(3, 0, 5000), exit(5, 11, 1000)];
    expect(exitThatEnded(exits, 4000)?.timestamp).toBe(5000);
  });

  it('is nothing when the app has not died since', () => {
    expect(exitThatEnded([exit(3, 0, 1000)], 4000)).toBeNull();
  });
});

describe('run marker', () => {
  it('comes back as it was written', () => {
    const marker = { model: 'gemma-4-e2b', startedAt: 1234, heldBytes: 4.4 * GB };
    expect(parseRunMarker(encodeRunMarker(marker))).toEqual(marker);
  });

  it('reads the bare id an older build left', () => {
    expect(parseRunMarker('gemma-4-e2b')).toEqual({ model: 'gemma-4-e2b', startedAt: 0, heldBytes: null });
  });
});

describe('judgeRun', () => {
  const marker = { model: 'gemma-4-e2b', startedAt: 1000, heldBytes: 4.4 * GB };

  it('holds a death the phone chose against the brain, with the most it was seen holding', () => {
    expect(judgeRun(marker, [LOW_MEMORY])).toEqual({ cause: 'memory', verdict: { at: 2000, heldBytes: 4.4 * GB } });
    expect(judgeRun({ ...marker, heldBytes: null }, [LOW_MEMORY])).toEqual({
      cause: 'memory',
      verdict: { at: 2000, heldBytes: 1.5 * GB },
    });
  });

  it('holds nothing against the brain when the app crashed', () => {
    expect(judgeRun(marker, [NATIVE_CRASH])).toEqual({ cause: 'fault', exit: NATIVE_CRASH });
  });

  it('says nothing of a run the reader closed', () => {
    expect(judgeRun(marker, [exit(10, 0)])).toEqual({ cause: 'closed' });
  });

  it('pairs a note that does not say when it began with the latest death', () => {
    const older = { model: 'gemma-4-e2b', startedAt: 0, heldBytes: null };
    expect(judgeRun(older, [NATIVE_CRASH, LOW_MEMORY])).toEqual({ cause: 'fault', exit: NATIVE_CRASH });
  });

  it('does not judge when the record cannot be read, or holds no death since', () => {
    expect(judgeRun(marker, null)).toEqual({ cause: 'unknown' });
    expect(judgeRun(marker, [exit(3, 0, 500)])).toEqual({ cause: 'unknown' });
  });
});

describe('parseVerdicts', () => {
  it('reads what was stored', () => {
    const stored = JSON.stringify({ 'gemma-4-e2b': { at: 2000, heldBytes: 5 } });
    expect(parseVerdicts(stored)).toEqual({ 'gemma-4-e2b': { at: 2000, heldBytes: 5 } });
  });

  it('drops anything malformed rather than failing', () => {
    expect(parseVerdicts(null)).toEqual({});
    expect(parseVerdicts('not json')).toEqual({});
    expect(parseVerdicts(JSON.stringify({ a: { heldBytes: 5 }, b: 'x', c: { at: 1 } }))).toEqual({
      c: { at: 1, heldBytes: null },
    });
  });
});

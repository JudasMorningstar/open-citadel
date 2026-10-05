import { useCallback, useEffect, useMemo, useState } from 'react';

import { useStagedCount } from '@/hooks/use-staged-count';
import { onIdle } from '@/lib/idle';
import type { DeviceVoiceRow } from '@/utils/device-voices';

/**
 * What the sheet shows before it is scrolled: the rows it has room for. They
 * are drawn with the sheet itself, in the frame it starts to rise, so no more
 * of them than are seen.
 */
const FIRST_ROWS = 9;
/**
 * How many more are drawn each time the thread is idle. Small, because each
 * step is a commit the UI thread has to mount, and a scroll under way shares
 * that thread: twelve at a time was felt as a stutter, six is not.
 */
const ROW_STEP = 6;
/** How long a step waits for a quiet moment before it is taken anyway. */
const IDLE_TIMEOUT_MS = 300;

type Opening = { language: string; shown: number };

/**
 * Which of the phone voice list's rows to draw now.
 *
 * The list sits in a plain scroll view, which draws every row it is given, and
 * a row is not cheap: English alone is 46 voices on a Samsung, and all of them
 * at once held the sheet on its placeholder for seconds. So rows arrive in two
 * ways. The list as a whole from the top, a screenful then a step at a time
 * (`useStagedCount`). And a language opened by hand, its first voices at once
 * and the rest a step at a time under them, with the languages below staying
 * where they are.
 *
 * `hold` keeps the list at its first screenful, for while the sheet it is in
 * is still rising: a step landing then stalls the rise partway.
 */
export function useStagedVoiceRows(rows: DeviceVoiceRow[], hold = false) {
  const count = useStagedCount(rows.length, FIRST_ROWS, ROW_STEP, hold);
  const [opening, setOpening] = useState<Opening | null>(null);

  const openingRow = opening
    ? rows.find((row) => row.kind === 'language' && row.language === opening.language)
    : undefined;
  // The rows reach a sheet's body a render after the tap that changed them
  // (they cross the sheet's portal), so for that render the language is still
  // closed here. Staging waits for it rather than concluding it is done.
  const openingTotal = openingRow?.kind === 'language' && openingRow.open ? openingRow.count : null;
  // State following the count, set while rendering: once all are shown, it is over.
  if (opening && openingTotal !== null && opening.shown >= openingTotal) setOpening(null);
  const stepping = opening !== null && openingTotal !== null;

  useEffect(() => {
    if (!stepping) return undefined;
    return onIdle(
      () => setOpening((current) => (current ? { ...current, shown: current.shown + ROW_STEP } : current)),
      IDLE_TIMEOUT_MS,
    );
  }, [stepping, opening]);

  const drawn = useMemo(() => {
    const top = count < rows.length ? rows.slice(0, count) : rows;
    if (!opening) return top;
    let language = '';
    let index = 0;
    return top.filter((row) => {
      if (row.kind === 'language') {
        language = row.language;
        index = 0;
        return true;
      }
      if (row.kind !== 'voice' || language !== opening.language) return true;
      index += 1;
      return index <= opening.shown;
    });
  }, [rows, count, opening]);

  /** Call as a closed language is opened: its voices are revealed in steps. */
  const stage = useCallback((language: string) => setOpening({ language, shown: ROW_STEP }), []);

  return { drawn, stage };
}

import { useMemo } from 'react';

import { useStagedCount } from '@/hooks/use-staged-count';
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
/**
 * How many rows are drawn before anybody has scrolled: what is seen, and two
 * screens more to scroll into.
 *
 * The list used to fill itself in to the end as soon as the sheet landed, a
 * step every fifth of a second for four seconds. Each step is about 35ms on a
 * Galaxy A33's UI thread, and one landing while the sheet was being dragged
 * was a stutter under the finger. Most times the sheet is opened, a voice is
 * picked near the top or it is closed again, and none of those rows were
 * needed. So the rest wait for the first scroll, which is the one thing that
 * says they are wanted, and a scroll and a drag of the sheet cannot happen
 * at once.
 */
const ROWS_AHEAD = 21;

/**
 * Which of the voice list's rows to draw now.
 *
 * The list sits in a plain scroll view, which draws every row it is given, and
 * a row is not cheap: English alone is 46 voices on a Samsung, and all of them
 * at once held the sheet on its placeholder for seconds. So the rows arrive
 * from the top, a screenful then a step at a time (`useStagedCount`).
 *
 * `hold` keeps the list as it is, for while the sheet it is in is rising or
 * being dragged: a step landing then stalls it partway. `wanted` says the
 * list has been scrolled, so the rest of it is worth drawing.
 */
export function useStagedVoiceRows(rows: DeviceVoiceRow[], hold = false, wanted = true) {
  const count = useStagedCount(rows.length, FIRST_ROWS, ROW_STEP, hold, wanted ? undefined : ROWS_AHEAD);
  return useMemo(() => (count < rows.length ? rows.slice(0, count) : rows), [rows, count]);
}

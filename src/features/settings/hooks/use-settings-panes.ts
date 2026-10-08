import React from 'react';

import { SETTINGS_PANES, stepBack, warmPanes, type SettingsPane } from '@/features/settings/utils/panes';
import { useBackHandler } from '@/hooks/use-back-handler';
import { useStagedCount } from '@/hooks/use-staged-count';
import { useSettledOnce } from '@/navigation/use-settled-once';

/**
 * Which pane of Settings is showing, and the way between panes.
 *
 * The panes are not screens. A screen is built in the frame of the press that
 * opens it, and on a Galaxy A33 a page of settings took most of a second to
 * build, with the press unanswered until it had. Here every pane lives on the
 * one Settings screen and is built ahead, hidden, one at a time while the
 * thread is idle after the drawer has landed (`KeptAlive`). Opening one is
 * then a reveal, and going back to it finds it as it was left.
 *
 * `enteredAt` is the pane Settings was opened straight onto, if any.
 */
export function useSettingsPanes(enteredAt: SettingsPane | null, close: () => void) {
  const [trail, setTrail] = React.useState<SettingsPane[]>(enteredAt ? [enteredAt] : []);
  const pane = trail.at(-1) ?? null;
  const back = stepBack(trail, enteredAt);

  const open = React.useCallback(
    (next: SettingsPane) => {
      setTrail((current) => [...current, next]);
    },
    [],
  );
  const leave = React.useCallback(() => {
    if (!back) return close();
    setTrail(back);
  }, [back, close]);

  // The system Back steps out of a pane like the header's button does. Left
  // alone when that step is out of Settings: the navigator's own Back does it.
  // Through `useBackHandler`, which subscribes once per pane entered. `leave`
  // is new on every render, and subscribing again each time put this ahead of
  // a sheet opened inside the pane: Back then left the pane with the sheet
  // still up.
  const inside = back !== null;
  useBackHandler(inside, leave);

  const landed = useSettledOnce();
  const warmCount = useStagedCount(SETTINGS_PANES.length, 0, 1, !landed);
  const warm = React.useMemo(() => warmPanes(warmCount), [warmCount]);

  return { pane, open, leave, warm, landed };
}

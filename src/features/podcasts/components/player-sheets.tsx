import React from 'react';

import { ChaptersSheet } from '@/features/podcasts/components/chapters-sheet';
import { SleepSheet } from '@/features/podcasts/components/sleep-sheet';
import { SpeedSheet } from '@/features/podcasts/components/speed-sheet';
import { UpNextSheet } from '@/features/podcasts/components/up-next-sheet';
import type { PlayerControls } from '@/features/podcasts/hooks/use-player-controls';
import type { usePlayerScreen } from '@/features/podcasts/hooks/use-player-screen';

type PlayerSheetsProps = {
  player: ReturnType<typeof usePlayerScreen>;
  controls: PlayerControls;
};

/** The full player's four sheets: speed, sleep, Up Next and chapters. */
export function PlayerSheets({ player, controls }: PlayerSheetsProps) {
  const { sheet, closeSheet, upNext } = controls;
  return (
    <>
      <SpeedSheet
        visible={sheet === 'speed'}
        speed={player.speed}
        showOverride={player.showOverride}
        onClose={closeSheet}
        onChange={controls.setSpeed}
      />
      <SleepSheet visible={sheet === 'sleep'} current={controls.sleepChoice} onClose={closeSheet} onChange={controls.setSleep} />
      <UpNextSheet
        visible={sheet === 'upnext'}
        episodes={player.queue}
        onClose={closeSheet}
        onPlay={upNext.play}
        onMove={upNext.move}
        onRemove={upNext.remove}
        onClear={upNext.clear}
      />
      <ChaptersSheet
        visible={sheet === 'chapters'}
        chapters={player.chapters}
        currentId={player.currentChapter?.id ?? null}
        onClose={closeSheet}
        onSelect={controls.seek}
      />
    </>
  );
}

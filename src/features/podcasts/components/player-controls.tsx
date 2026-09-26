import React from 'react';
import { View } from 'react-native';

import { PlayerOptions } from '@/features/podcasts/components/player-options';
import { PlayerProgress } from '@/features/podcasts/components/player-progress';
import { PlayerTransport } from '@/features/podcasts/components/player-transport';
import type { PlayerControls as Controls } from '@/features/podcasts/hooks/use-player-controls';
import type { usePlayerScreen } from '@/features/podcasts/hooks/use-player-screen';

type PlayerControlsProps = {
  player: ReturnType<typeof usePlayerScreen>;
  controls: Controls;
};

/** Where the listener is and what they can do: the scrubber, the transport, then speed, sleep, Up Next and chapters. */
export function PlayerControls({ player, controls }: PlayerControlsProps) {
  return (
    <View className="gap-8">
      <PlayerProgress
        chapterTitle={player.currentChapter?.title ?? null}
        position={player.clock.position}
        duration={player.clock.duration}
        error={player.error}
        onChapters={controls.open('chapters')}
        onSeek={controls.seek}
      />
      <PlayerTransport
        playing={player.isPlaying}
        buffering={player.isBuffering}
        skipBackSec={player.skipBackSec}
        skipForwardSec={player.skipForwardSec}
        onToggle={controls.toggle}
        onBack={controls.back}
        onForward={controls.forward}
      />
      <PlayerOptions
        speedLabel={player.speedLabel}
        sleepLabel={player.sleepLabel}
        upNextCount={player.queue.length}
        hasChapters={player.chapters.length > 0}
        onSpeed={controls.open('speed')}
        onSleep={controls.open('sleep')}
        onUpNext={controls.open('upnext')}
        onChapters={controls.open('chapters')}
      />
    </View>
  );
}

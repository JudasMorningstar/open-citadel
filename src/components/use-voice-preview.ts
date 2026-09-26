import { useCallback, useEffect, useRef, useState } from 'react';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { File, Paths } from 'expo-file-system';

import { VOICE_LABELS, type KokoroVoice } from '@/services/device-tts/catalogue';
import { loadEngine, synthesize } from '@/services/device-tts/engine';
import { encodeWav } from '@/utils/wav';

function previewText(voice: KokoroVoice): string {
  return `Hi, I'm ${VOICE_LABELS[voice]}. Welcome to Open Citadel — your personal knowledge companion.`;
}

/**
 * Plays a short spoken sample of a Kokoro voice — picking a voice by name
 * alone in `TtsSettingsPanel` doesn't tell you much about how it sounds.
 *
 * Synthesizes through the same `device-tts/engine.ts` singleton the reader
 * uses, then writes the result to a scratch WAV file and plays it with
 * `expo-audio` — there's no reader/navigator around to play through when
 * this is opened from Settings, so this can't reuse Readium's own native
 * playback the way an active reading session does.
 */
export function useVoicePreview() {
  const [previewingVoice, setPreviewingVoice] = useState<KokoroVoice | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  // Bumped on every `preview`/`stop` call so a synthesis or file write that's
  // still in flight when a newer call (or unmount) supersedes it can tell and
  // avoid starting playback nobody asked for anymore.
  const generationRef = useRef(0);

  const stopPlayer = useCallback(() => {
    playerRef.current?.remove();
    playerRef.current = null;
  }, []);

  const stop = useCallback(() => {
    generationRef.current += 1;
    stopPlayer();
    setPreviewingVoice(null);
  }, [stopPlayer]);

  const preview = useCallback(
    async (voice: KokoroVoice) => {
      const generation = ++generationRef.current;
      stopPlayer();
      setPreviewingVoice(voice);

      try {
        await loadEngine();

        const chunks: Float32Array[] = [];
        let sampleRate = 24000;
        for await (const chunk of synthesize(previewText(voice), { voice, speed: 1 })) {
          if (generation !== generationRef.current) return;
          chunks.push(chunk.audio);
          sampleRate = chunk.sampleRate;
        }
        if (generation !== generationRef.current) return;

        const file = new File(Paths.cache, 'voice-preview.wav');
        file.create({ overwrite: true });
        file.write(encodeWav(chunks, sampleRate));

        const player = createAudioPlayer(file.uri);
        playerRef.current = player;
        player.addListener('playbackStatusUpdate', (status) => {
          if (!status.didJustFinish || playerRef.current !== player) return;
          stopPlayer();
          if (generation === generationRef.current) setPreviewingVoice(null);
        });
        player.play();
      } catch {
        if (generation === generationRef.current) setPreviewingVoice(null);
      }
    },
    [stopPlayer],
  );

  useEffect(() => stop, [stop]);

  return { previewingVoice, preview, stop };
}

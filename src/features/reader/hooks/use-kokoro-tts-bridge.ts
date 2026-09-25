/**
 * Answers Readium's native TTS engine when it asks for a voice.
 *
 * Readium still owns everything else — walking the EPUB, locators,
 * pause/resume/skip, page-turn-on-crossing. The native `KokoroTTSEngine`
 * (iOS) / `KokoroTtsEngine` (Android) it speaks through has nothing to
 * synthesize with on its own, since Kokoro's model runs in
 * `react-native-executorch`'s JS layer — so it asks JS for each utterance's
 * audio via `onTTSSynthesisRequest` and this hook answers with
 * `ttsProvideAudioChunk` calls, one per streamed chunk.
 */
import { useCallback } from 'react';

import type { ReadiumViewRef, TTSSynthesisRequest } from '@dr33m/react-native-readium';
import { KOKORO_SAMPLE_RATE } from 'react-native-executorch';

import { DEFAULT_VOICE, KOKORO_EN_US_VOICES, type KokoroVoice } from '@/services/device-tts/catalogue';
import { getEngine, loadEngine, stop as stopSynthesis, synthesize } from '@/services/device-tts/engine';

function isKokoroVoice(voice: string | undefined): voice is KokoroVoice {
  return !!voice && (KOKORO_EN_US_VOICES as readonly string[]).includes(voice);
}

/** The exact bytes of a chunk's audio, regardless of how its Float32Array views its buffer. */
function chunkBytes(audio: Float32Array): ArrayBuffer {
  // Never actually backed by a SharedArrayBuffer here — it's native PCM handed
  // across the JSI bridge — so the union type this lib version gives `.slice`
  // is wider than reality.
  return audio.buffer.slice(audio.byteOffset, audio.byteOffset + audio.byteLength) as ArrayBuffer;
}

export function useKokoroTtsBridge(readerRef: React.RefObject<ReadiumViewRef | null>) {
  const onSynthesisRequest = useCallback(
    (request: TTSSynthesisRequest) => {
      void (async () => {
        try {
          if (!getEngine()) await loadEngine();

          const voice = isKokoroVoice(request.voice) ? request.voice : DEFAULT_VOICE;
          let sentAny = false;
          for await (const chunk of synthesize(request.text, { voice, speed: request.speed })) {
            sentAny = true;
            const isLast = chunk.chunkIndex === chunk.totalChunks - 1;
            readerRef.current?.ttsProvideAudioChunk(request.requestId, chunkBytes(chunk.audio), chunk.sampleRate, isLast);
          }
          // An empty utterance yields no chunks — still answer, so the native
          // engine's `speak` isn't left waiting on a chunk that never comes.
          if (!sentAny) {
            readerRef.current?.ttsProvideAudioChunk(request.requestId, new ArrayBuffer(0), KOKORO_SAMPLE_RATE, true);
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Speech synthesis failed';
          readerRef.current?.ttsSynthesisFailed(request.requestId, message);
        }
      })();
    },
    [readerRef],
  );

  const onSynthesisCancel = useCallback(() => {
    stopSynthesis();
  }, []);

  return { onSynthesisRequest, onSynthesisCancel };
}

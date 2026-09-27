/**
 * The one loaded Kokoro pipeline, held for as long as the reader might want
 * a voice — a singleton so repeated reading sessions never pay to reload it.
 *
 * This is a much thinner singleton than `device-llm/engine.ts`'s: Kokoro has
 * no per-conversation cache to share, so the only hazard is calling
 * `synthesize` twice at once, which `exclusive` alone covers. What is
 * deliberately NOT shared here is any notion of an active reading session —
 * which sentence is playing, where it paused — because on both the LLM and
 * TTS side, that state belongs to whatever is using the engine, not to it.
 */

import type { KokoroTextToSpeech } from 'react-native-executorch';

import { getExecuTorch } from '@/lib/executorch';
import type { KokoroVoice } from '@/services/device-tts/catalogue';
import { localModelFiles } from '@/services/device-tts/files';

let engine: KokoroTextToSpeech<KokoroVoice> | null = null;
let loading: Promise<void> | null = null;
/**
 * Tail of the queue a `synthesize` call waits its turn on.
 *
 * Not `createExclusiveQueue`: that factory serializes a function's whole
 * *invocation*, but the work here worth serializing is a generator's whole
 * *drain* — from the caller's first `next()` to its last — since the native
 * pipeline rejects a second concurrent caller. Resolves only once a
 * generator finishes, so the next one in line does not start early.
 */
let synthesisQueue: Promise<unknown> = Promise.resolve();

export function getEngine(): KokoroTextToSpeech<KokoroVoice> | null {
  return engine;
}

/**
 * Loads Kokoro from local files, if it isn't already loaded.
 *
 * Never fetches: like `device-llm`'s `loadEngine`, this must not start a
 * multi-gigabyte-or-not download just because something asked for a voice.
 */
export function loadEngine(): Promise<void> {
  if (engine) return Promise.resolve();
  if (!loading) {
    loading = (async () => {
      const et = getExecuTorch();
      const files = await localModelFiles();
      if (!et || !files) throw new Error("Kokoro isn't downloaded.");
      engine = await et.createKokoroTextToSpeech(files);
    })().finally(() => {
      loading = null;
    });
  }
  return loading;
}

/**
 * Streams synthesized audio for one utterance. Serialized: the native
 * pipeline rejects a second concurrent caller.
 *
 * The queue slot is reserved synchronously, on call, rather than on first
 * iteration — a plain function returning a generator, not a generator
 * function itself — so two calls always run in the order they were made, not
 * the order each one happened to start being drained.
 */
export function synthesize(
  text: string,
  options: { voice: KokoroVoice; speed?: number },
): AsyncGenerator<{ audio: Float32Array; sampleRate: number; duration: number; chunkIndex: number; totalChunks: number }> {
  const current = engine;
  if (!current) throw new Error('Kokoro is not loaded.');

  const myTurn = synthesisQueue;
  let releaseTurn!: () => void;
  synthesisQueue = new Promise<void>((resolve) => {
    releaseTurn = resolve;
  });

  async function* run() {
    await myTurn;
    try {
      yield* current!.synthesize(text, options);
    } finally {
      releaseTurn();
    }
  }
  return run();
}

export function stop(): void {
  engine?.synthesizeStop();
}

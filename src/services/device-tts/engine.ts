/**
 * The one loaded Kokoro pipeline, held for as long as the reader might want
 * a voice — a singleton so repeated reading sessions never pay to reload it.
 *
 * "One" is deliberate: each accent needs its own phonemizer, hence its own
 * pipeline, but two FP32 pipelines would double the memory that already
 * exhausts a 2 GB phone. So the loaded pipeline is swapped when a voice of the
 * other accent is asked for. That swap happens inside the synthesis queue, so
 * it can never dispose a pipeline that is mid-utterance.
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
import { VOICE_ACCENTS, type KokoroAccent, type KokoroVoice } from '@/services/device-tts/catalogue';
import { localModelFiles } from '@/services/device-tts/files';

let engine: { accent: KokoroAccent; pipeline: KokoroTextToSpeech<string> } | null = null;
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

/**
 * The pipeline for `accent`, loaded from local files if it isn't the one
 * already loaded. Only ever called from inside a synthesis turn.
 *
 * Never fetches: like `device-llm`'s `loadEngine`, this must not start a
 * multi-gigabyte-or-not download just because something asked for a voice.
 */
async function pipelineFor(accent: KokoroAccent): Promise<KokoroTextToSpeech<string>> {
  if (engine?.accent === accent) return engine.pipeline;

  engine?.pipeline.dispose();
  engine = null;

  const et = getExecuTorch();
  const files = await localModelFiles(accent);
  if (!et || !files) throw new Error("Kokoro isn't downloaded.");
  const pipeline = await et.createKokoroTextToSpeech(files);
  engine = { accent, pipeline };
  return pipeline;
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
  const myTurn = synthesisQueue;
  let releaseTurn!: () => void;
  synthesisQueue = new Promise<void>((resolve) => {
    releaseTurn = resolve;
  });

  async function* run() {
    await myTurn;
    try {
      const pipeline = await pipelineFor(VOICE_ACCENTS[options.voice]);
      yield* pipeline.synthesize(text, options);
    } finally {
      releaseTurn();
    }
  }
  return run();
}

export function stop(): void {
  engine?.pipeline.synthesizeStop();
}

/**
 * Frees the loaded voice, once whatever it is saying has finished.
 *
 * For when memory is needed for something larger: waking a brain on a phone
 * where it is a tight fit (`stores/model`). The voice loads again the next
 * time something is read aloud. Takes its turn in the synthesis queue, so it
 * never frees a pipeline that is mid-utterance.
 */
export function releaseVoice(): Promise<void> {
  if (!engine) return Promise.resolve();
  const myTurn = synthesisQueue;
  const done = (async () => {
    await myTurn;
    engine?.pipeline.dispose();
    engine = null;
  })();
  // A failed dispose must not hold up the next utterance.
  synthesisQueue = done.catch(() => undefined);
  return done;
}

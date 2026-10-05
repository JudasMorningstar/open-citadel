/**
 * How fast a voice engine runs on this phone, and how an utterance is cut up
 * to suit. Written about Kokoro, where it was first needed; Supertonic is
 * paced the same way with its own limits.
 *
 * One Kokoro forward takes a chunk of up to 126 phonemes, about eight seconds
 * of speech, and nothing can be heard until the whole chunk is done. The
 * reader asks for a sentence at a time and only about a second before the last
 * one runs out, so the wait for a sentence's first chunk is silence between
 * sentences. Left to itself the pipeline keeps any sentence that fits in one
 * chunk whole: on a Galaxy A33 the synthesizer's forward was logged at 9 to 13
 * seconds for such a chunk, which can hold no more than about eight seconds of
 * speech (an estimate from the phoneme limit, not yet measured on the phone).
 *
 * A smaller chunk is the same work per second of speech, heard sooner, and the
 * next chunk is made while it plays. So the phone's speed is measured as it
 * goes, and a phone that cannot keep up gets short chunks: a few seconds of
 * silence spread over a sentence's own pauses instead of ten in one piece. A
 * phone that keeps up gets the pipeline's own cut, which sounds best.
 */

import type { Part } from '@/services/device-tts/lead';

/**
 * How short an engine's chunks are cut, in whatever its pipeline counts a
 * chunk in.
 */
export interface ChunkLimits {
  /** For a phone that makes speech slower than it is spoken. */
  slow: number;
  /**
   * Before anything has been measured. Short enough that the first sentence
   * starts soon on a slow phone, long enough that a fast one hears at most a
   * join or two before it is given the pipeline's own cut.
   */
  unmeasured: number;
}

/** Kokoro counts phonemes: its model takes up to 126 a chunk. */
export const KOKORO_CHUNKS: ChunkLimits = { slow: 40, unmeasured: 60 };


/**
 * The slowest pace that still counts as keeping up: seconds of work per second
 * of speech. Under 1 on purpose. The next sentence is only asked for about a
 * second before the current one ends, so a phone barely at real time still
 * leaves gaps.
 */
export const KEEPS_UP_PACE = 0.9;

/** Chunks the pace is averaged over: enough to ride out one odd chunk, few enough to follow the phone heating up. */
const WINDOW = 8;

/**
 * The most one chunk may hold at this pace, or `undefined` to leave the cut
 * to the pipeline (its model's limit).
 */
export function chunkLimitFor(pace: number | null, limits: ChunkLimits): number | undefined {
  if (pace === null) return limits.unmeasured;
  return pace > KEEPS_UP_PACE ? limits.slow : undefined;
}

export interface PaceMeter {
  /** One chunk: the speech it holds and how long it took to make, both in seconds. */
  record(audioSeconds: number, workSeconds: number): void;
  /** Seconds of work per second of speech over the last few chunks, or null before the first. */
  pace(): number | null;
}

export function createPaceMeter(): PaceMeter {
  const samples: { audio: number; work: number }[] = [];
  return {
    record(audioSeconds, workSeconds) {
      // A chunk with no speech in it (a lone dash) says nothing about speed.
      if (audioSeconds <= 0 || workSeconds <= 0) return;
      samples.push({ audio: audioSeconds, work: workSeconds });
      if (samples.length > WINDOW) samples.shift();
    },
    pace() {
      if (samples.length === 0) return null;
      let audio = 0;
      let work = 0;
      for (const sample of samples) {
        audio += sample.audio;
        work += sample.work;
      }
      return work / audio;
    },
  };
}

/** What one utterance cost, for the development log. */
export interface UtteranceTiming {
  chunks: number;
  /** Seconds from asking to the first chunk: the silence before this utterance. */
  firstAudioSeconds: number;
  audioSeconds: number;
  workSeconds: number;
}

/** One piece of an utterance's audio, as either engine's pipeline hands it over. */
export interface SpeechChunk {
  audio: Float32Array;
  sampleRate: number;
  duration: number;
  chunkIndex: number;
  totalChunks: number;
}

/** What pacing needs of a pipeline: both engines' fit, each with its own options `O`. */
interface Pipeline<O> {
  synthesize(text: string, options: O & { maxChunkLength?: number }): AsyncGenerator<SpeechChunk>;
  synthesizeStop(): void;
}

/**
 * One utterance from `pipeline`, cut to suit the measured pace, with every
 * chunk timed into `meter`.
 *
 * `fresh` is a pipeline that has not run since it was loaded. Its first
 * forward also pays for the backend setting itself up, so that chunk is left
 * out of the measurement.
 */
export async function* pacedSynthesis<O extends object>(
  pipeline: Pipeline<NoInfer<O>>,
  text: string,
  options: O & { maxChunkLength?: number },
  meter: PaceMeter,
  config: {
    limits?: ChunkLimits;
    /** Cuts the utterance into pieces itself, instead of one limit for the whole of it (`lead.ts`). */
    parts?: (text: string, pace: number | null) => Part[];
    fresh?: boolean;
    now?: () => number;
    onDone?: (timing: UtteranceTiming) => void;
  } = {},
): AsyncGenerator<SpeechChunk> {
  const now = config.now ?? Date.now;
  const limit = options.maxChunkLength ?? chunkLimitFor(meter.pace(), config.limits ?? KOKORO_CHUNKS);
  const whole: Part[] = [{ text, limit: undefined }];
  const parts = config.parts?.(text, meter.pace()) ?? [{ text, limit }];
  const cut = parts.length > 1 || parts[0]?.limit !== undefined;
  const timing: UtteranceTiming = { chunks: 0, firstAudioSeconds: 0, audioSeconds: 0, workSeconds: 0 };
  let skip = config.fresh === true;

  async function* timed(pieces: Part[]) {
    for (const [index, piece] of pieces.entries()) {
      const before = timing.chunks;
      const more = index < pieces.length - 1;
      let asked = now();
      for await (const chunk of pipeline.synthesize(piece.text, { ...options, maxChunkLength: piece.limit })) {
        const work = (now() - asked) / 1000;
        if (timing.chunks === 0) timing.firstAudioSeconds = work;
        timing.chunks += 1;
        timing.audioSeconds += chunk.duration;
        timing.workSeconds += work;
        if (skip) skip = false;
        else meter.record(chunk.duration, work);
        // Numbered across the pieces: the caller ends the utterance on the
        // chunk that says it is the last, and a piece's own last is not it
        // while another piece is still to come.
        const totalChunks = more ? timing.chunks + 1 : before + chunk.totalChunks;
        yield { ...chunk, chunkIndex: timing.chunks - 1, totalChunks };
        // Timed from the moment the next chunk is asked for, so whatever the
        // caller did with this one is not counted as the engine's work.
        asked = now();
      }
    }
  }

  try {
    try {
      yield* timed(parts);
    } catch (error) {
      // A short limit can be one the text has no way to meet: a web address
      // or a very long word is a run of phonemes with nowhere to cut. Nothing
      // has been sent yet, so say it again whole rather than lose the
      // sentence.
      if (timing.chunks > 0 || !cut) throw error;
      pipeline.synthesizeStop();
      yield* timed(whole);
    }
    config.onDone?.(timing);
  } finally {
    // The pipeline raises its "busy" flag before it phonemizes and cuts the
    // text, outside the block that lowers it. A failure there leaves it up
    // and every later utterance is refused until the app restarts. This is
    // the only caller, one at a time, so lowering it here is always right.
    pipeline.synthesizeStop();
  }
}

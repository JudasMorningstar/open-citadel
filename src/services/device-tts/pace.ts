/**
 * How fast Kokoro runs on this phone, and how an utterance is cut up to suit.
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

import type { KokoroTextToSpeech, KokoroTtsChunk, KokoroTtsOptions } from 'react-native-executorch';

/** Phonemes per chunk for a phone that makes speech slower than it is spoken. */
export const SLOW_CHUNK_LIMIT = 40;

/**
 * Phonemes per chunk before anything has been measured. Short enough that the
 * first sentence starts soon on a slow phone, long enough that a fast one
 * hears at most a join or two before it is given the pipeline's own cut.
 */
export const UNMEASURED_CHUNK_LIMIT = 60;

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
 * The most phonemes one chunk may hold at this pace, or `undefined` to leave
 * the cut to the pipeline (its model's limit).
 */
export function chunkLimitFor(pace: number | null): number | undefined {
  if (pace === null) return UNMEASURED_CHUNK_LIMIT;
  return pace > KEEPS_UP_PACE ? SLOW_CHUNK_LIMIT : undefined;
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

type Pipeline<K extends PropertyKey> = Pick<KokoroTextToSpeech<K>, 'synthesize' | 'synthesizeStop'>;

/**
 * One utterance from `pipeline`, cut to suit the measured pace, with every
 * chunk timed into `meter`.
 *
 * `fresh` is a pipeline that has not run since it was loaded. Its first
 * forward also pays for the backend setting itself up, so that chunk is left
 * out of the measurement.
 */
export async function* pacedSynthesis<K extends PropertyKey>(
  pipeline: Pipeline<K>,
  text: string,
  options: KokoroTtsOptions<K>,
  meter: PaceMeter,
  config: { fresh?: boolean; now?: () => number; onDone?: (timing: UtteranceTiming) => void } = {},
): AsyncGenerator<KokoroTtsChunk> {
  const now = config.now ?? Date.now;
  const limit = options.maxChunkLength ?? chunkLimitFor(meter.pace());
  const timing: UtteranceTiming = { chunks: 0, firstAudioSeconds: 0, audioSeconds: 0, workSeconds: 0 };
  let skip = config.fresh === true;

  async function* timed(maxChunkLength: number | undefined) {
    let asked = now();
    for await (const chunk of pipeline.synthesize(text, { ...options, maxChunkLength })) {
      const work = (now() - asked) / 1000;
      if (timing.chunks === 0) timing.firstAudioSeconds = work;
      timing.chunks += 1;
      timing.audioSeconds += chunk.duration;
      timing.workSeconds += work;
      if (skip) skip = false;
      else meter.record(chunk.duration, work);
      yield chunk;
      // Timed from the moment the next chunk is asked for, so whatever the
      // caller did with this one is not counted as Kokoro's work.
      asked = now();
    }
  }

  try {
    try {
      yield* timed(limit);
    } catch (error) {
      // A short limit can be one the text has no way to meet: a web address
      // or a very long word is a run of phonemes with nowhere to cut. Nothing
      // has been sent yet, so say it again whole rather than lose the
      // sentence.
      if (timing.chunks > 0 || limit === undefined) throw error;
      pipeline.synthesizeStop();
      yield* timed(undefined);
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

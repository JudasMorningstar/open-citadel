import { describe, expect, it } from 'vitest';

import {
  SLOW_CHUNK_LIMIT,
  UNMEASURED_CHUNK_LIMIT,
  chunkLimitFor,
  createPaceMeter,
  pacedSynthesis,
  type UtteranceTiming,
} from '@/services/device-tts/pace';

type Chunk = { audio: Float32Array; sampleRate: number; duration: number; chunkIndex: number; totalChunks: number };

const chunk = (duration: number, chunkIndex = 0, totalChunks = 1): Chunk => ({
  audio: new Float32Array(1),
  sampleRate: 24000,
  duration,
  chunkIndex,
  totalChunks,
});

/**
 * A stand-in pipeline. Each call to `synthesize` runs the next script: the
 * chunks it yields, how long each takes on the fake clock, or an error it
 * throws before the first one. It keeps the real pipeline's busy flag, raised
 * before the work and only lowered by a clean finish or `synthesizeStop`.
 */
function fakePipeline(scripts: ({ chunks: [duration: number, workMs: number][] } | { fails: string })[]) {
  const clock = { ms: 0 };
  const limits: (number | undefined)[] = [];
  const state = { busy: false };
  const pipeline = {
    async *synthesize(_text: string, options: { voice: string; maxChunkLength?: number }) {
      if (state.busy) throw new Error('Synthesis is already in progress.');
      state.busy = true;
      limits.push(options.maxChunkLength);
      const script = scripts.shift();
      if (!script) throw new Error('No script left.');
      if ('fails' in script) throw new Error(script.fails);
      for (const [index, [duration, workMs]] of script.chunks.entries()) {
        clock.ms += workMs;
        yield chunk(duration, index, script.chunks.length);
      }
      state.busy = false;
    },
    synthesizeStop() {
      state.busy = false;
    },
  };
  return { pipeline, limits, state, now: () => clock.ms, clock };
}

async function drain<T>(source: AsyncGenerator<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const item of source) out.push(item);
  return out;
}

describe('chunkLimitFor', () => {
  it('starts short before anything is measured', () => {
    expect(chunkLimitFor(null)).toBe(UNMEASURED_CHUNK_LIMIT);
  });

  it('leaves the cut to the pipeline on a phone that keeps up', () => {
    expect(chunkLimitFor(0.3)).toBeUndefined();
    expect(chunkLimitFor(0.9)).toBeUndefined();
  });

  it('cuts short on a phone that cannot keep up, real time included', () => {
    expect(chunkLimitFor(1)).toBe(SLOW_CHUNK_LIMIT);
    expect(chunkLimitFor(1.5)).toBe(SLOW_CHUNK_LIMIT);
  });
});

describe('createPaceMeter', () => {
  it('has no pace before the first chunk', () => {
    expect(createPaceMeter().pace()).toBeNull();
  });

  it('is work over speech across chunks, not an average of ratios', () => {
    const meter = createPaceMeter();
    meter.record(2, 3);
    meter.record(8, 12);
    expect(meter.pace()).toBeCloseTo(1.5);
  });

  it('ignores a chunk with no speech in it', () => {
    const meter = createPaceMeter();
    meter.record(0, 0.4);
    expect(meter.pace()).toBeNull();
  });

  it('follows the phone slowing down: only the last few chunks count', () => {
    const meter = createPaceMeter();
    for (let i = 0; i < 8; i++) meter.record(4, 2);
    expect(meter.pace()).toBeCloseTo(0.5);
    for (let i = 0; i < 8; i++) meter.record(4, 6);
    expect(meter.pace()).toBeCloseTo(1.5);
  });
});

describe('pacedSynthesis', () => {
  it('times each chunk into the meter and reports the utterance', async () => {
    const { pipeline, limits, now } = fakePipeline([{ chunks: [[2, 3000], [4, 6000]] }]);
    const meter = createPaceMeter();
    let timing: UtteranceTiming | undefined;

    const chunks = await drain(
      pacedSynthesis(pipeline, 'text', { voice: 'af_heart' }, meter, { now, onDone: (t) => (timing = t) }),
    );

    expect(chunks.map((c) => c.duration)).toEqual([2, 4]);
    expect(limits).toEqual([UNMEASURED_CHUNK_LIMIT]);
    expect(meter.pace()).toBeCloseTo(1.5);
    expect(timing).toEqual({ chunks: 2, firstAudioSeconds: 3, audioSeconds: 6, workSeconds: 9 });
  });

  it('does not count what the caller does between chunks as work', async () => {
    const { pipeline, now, clock } = fakePipeline([{ chunks: [[2, 1000], [2, 1000]] }]);
    const meter = createPaceMeter();

    const source = pacedSynthesis(pipeline, 'text', { voice: 'af_heart' }, meter, { now });
    while (!(await source.next()).done) clock.ms += 5000;

    expect(meter.pace()).toBeCloseTo(0.5);
  });

  it("leaves a fresh pipeline's first chunk out of the measurement", async () => {
    const { pipeline, now } = fakePipeline([{ chunks: [[2, 9000], [2, 1000]] }]);
    const meter = createPaceMeter();

    await drain(pacedSynthesis(pipeline, 'text', { voice: 'af_heart' }, meter, { now, fresh: true }));

    expect(meter.pace()).toBeCloseTo(0.5);
  });

  it('cuts by the pace measured so far', async () => {
    const slow = createPaceMeter();
    slow.record(2, 3);
    const fast = createPaceMeter();
    fast.record(4, 1);
    const first = fakePipeline([{ chunks: [[2, 3000]] }]);
    const second = fakePipeline([{ chunks: [[2, 500]] }]);

    await drain(pacedSynthesis(first.pipeline, 'text', { voice: 'af_heart' }, slow, { now: first.now }));
    await drain(pacedSynthesis(second.pipeline, 'text', { voice: 'af_heart' }, fast, { now: second.now }));

    expect(first.limits).toEqual([SLOW_CHUNK_LIMIT]);
    expect(second.limits).toEqual([undefined]);
  });

  it('says a sentence whole when it cannot be cut short', async () => {
    const { pipeline, limits, now } = fakePipeline([{ fails: 'cannot be divided' }, { chunks: [[6, 4000]] }]);

    const chunks = await drain(pacedSynthesis(pipeline, 'text', { voice: 'af_heart' }, createPaceMeter(), { now }));

    expect(chunks).toHaveLength(1);
    expect(limits).toEqual([UNMEASURED_CHUNK_LIMIT, undefined]);
  });

  it('does not say it again once a chunk has been sent', async () => {
    const pipeline = {
      async *synthesize() {
        yield chunk(2, 0, 2);
        throw new Error('forward failed');
      },
      synthesizeStop() {},
    };

    await expect(drain(pacedSynthesis(pipeline, 'text', { voice: 'af_heart' }, createPaceMeter()))).rejects.toThrow(
      'forward failed',
    );
  });

  it('lowers the busy flag a failure leaves up, so the next utterance is not refused', async () => {
    const { pipeline, state, now } = fakePipeline([{ fails: 'phonemizer' }, { fails: 'phonemizer' }, { chunks: [[2, 1000]] }]);
    const meter = createPaceMeter();

    await expect(drain(pacedSynthesis(pipeline, 'text', { voice: 'af_heart' }, meter, { now }))).rejects.toThrow('phonemizer');
    expect(state.busy).toBe(false);

    await expect(drain(pacedSynthesis(pipeline, 'next', { voice: 'af_heart' }, meter, { now }))).resolves.toHaveLength(1);
  });
});

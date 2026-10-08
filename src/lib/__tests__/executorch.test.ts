import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native-blob-util', () => ({
  default: { fs: { dirs: { DocumentDir: '/docs', SDCardDir: '/external' } } },
}));
// `executorch.ts` also imports TurboModuleRegistry for `isExecuTorchAvailable`,
// unused by `cachePath` — stubbed so importing the real module doesn't pull in
// react-native's Flow-syntax entry point, which vitest cannot parse.
vi.mock('react-native', () => ({ TurboModuleRegistry: { get: () => null } }));

const { cachePath } = await import('../executorch');

/** ExecuTorch's fetcher, as published: the file `cachePath` mirrors. */
const FETCHER = readFileSync(
  path.join(
    path.dirname(createRequire(import.meta.url).resolve('react-native-executorch/package.json')),
    'src/fetcher/fetcher.ts',
  ),
  'utf8',
);

/** The library's own hash, lifted out of its source and run. */
const libraryDjb2 = (() => {
  const body = /const djb2 = \(s: string\): number => \{([\s\S]*?)\n\};/.exec(FETCHER)?.[1];
  if (!body) throw new Error('djb2 is gone from the fetcher');
  return new Function('s', body) as (s: string) => number;
})();

const URL = 'https://huggingface.co/software-mansion/react-native-executorch-gemma-4/resolve/v0.10.0/e2b/xnnpack/model.pte';

describe('cachePath', () => {
  // A mismatch reads every downloaded brain (or voice pack) as missing. If one
  // of these fails after a library upgrade, update `cachePath` to match the
  // fetcher — every catalogue (`device-llm`, `device-tts`) depends on it.
  it("still matches the fetcher's naming", () => {
    expect(FETCHER).toContain('return `${RNE_DIRECTORY}/${djb2(urlWithoutQuery)}_${basename}`;');
    expect(FETCHER).toContain("const urlWithoutQuery = url.split('?')[0]!;");
    expect(FETCHER).toContain("const basename = urlWithoutQuery.split('/').pop() || 'model';");
    expect(FETCHER).toContain('RNBlobUtil.fs.dirs.SDCardDir || RNBlobUtil.fs.dirs.DocumentDir');
    expect(FETCHER).toContain('`${RNBlobUtil.fs.dirs.DocumentDir}/react-native-executorch`');
    expect(FETCHER).toContain('`${ANDROID_DIRECTORY}/react-native-executorch`');
  });

  it("hashes a URL the way the fetcher does, ignoring its query", () => {
    const expected = `/docs/react-native-executorch/${libraryDjb2(URL)}_model.pte`;
    expect(cachePath(URL)).toBe(expected);
    expect(cachePath(`${URL}?download=true`)).toBe(expected);
  });
});

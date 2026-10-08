/**
 * The on-device AI runtime, loaded on first use.
 *
 * `react-native-executorch` throws at import when its native module is not in
 * the binary: on web, and in any dev build made before the module was added.
 * A static import would take the whole app down in those cases, so it is
 * required here, once, behind a guard.
 *
 * Deferring it pays twice. Importing the package starts a worklet runtime and
 * builds a registry of every model it knows, and none of that is needed until
 * Samwell is actually woken on the device.
 */

import { TurboModuleRegistry } from 'react-native';
import RNBlobUtil from 'react-native-blob-util';

type ExecuTorch = typeof import('react-native-executorch');

let resolved = false;
let module: ExecuTorch | null = null;

/** The runtime, or null when this binary does not carry it. */
export function getExecuTorch(): ExecuTorch | null {
  if (resolved) return module;
  resolved = true;

  if (process.env.EXPO_OS === 'web') return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    module = require('react-native-executorch') as ExecuTorch;
    // Off before the first download: by default every model fetched from
    // Software Mansion's repos also reports an anonymous event to them, and
    // nothing Samwell does on the device leaves it.
    module.setTelemetryEnabled(false);
  } catch {
    module = null;
  }

  return module;
}

/**
 * Whether on-device Samwell can run in this binary at all.
 *
 * Asks for the native module by name rather than loading the package, so it is
 * cheap enough for module scope and costs nothing at startup.
 */
export function isExecuTorchAvailable(): boolean {
  if (process.env.EXPO_OS === 'web') return false;
  return TurboModuleRegistry.get('RnExecutorch') != null;
}

/** The same hash ExecuTorch's fetcher names its cached files with. */
function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  }
  return h;
}

/**
 * Where ExecuTorch's `download` keeps `url`, mirrored from its private
 * `cachePathFor`. Shared by every catalogue (`device-llm`, `device-tts`) that
 * needs to ask "is this already on disk" without triggering a fetch.
 */
export function cachePath(url: string): string {
  const dirs = RNBlobUtil.fs.dirs;
  const root = process.env.EXPO_OS === 'android' ? dirs.SDCardDir || dirs.DocumentDir : dirs.DocumentDir;
  const bare = url.split('?')[0]!;
  const basename = bare.split('/').pop() || 'model';
  return `${root}/react-native-executorch/${djb2(bare)}_${basename}`;
}

/**
 * A private FIFO queue: each call the returned function is given waits for
 * every one queued before it to settle, success or failure, before it runs.
 *
 * Every native runner ExecuTorch hands back (an LLM, Kokoro) rejects a second
 * concurrent caller outright rather than queueing it itself, so each one owns
 * its own queue via a fresh call to this factory.
 */
export function createExclusiveQueue(): <T>(fn: () => Promise<T>) => Promise<T> {
  let queue: Promise<unknown> = Promise.resolve();
  return function exclusive<T>(fn: () => Promise<T>): Promise<T> {
    const run = queue.then(fn, fn);
    queue = run.catch(() => undefined);
    return run;
  };
}

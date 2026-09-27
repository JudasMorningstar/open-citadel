import { useMutation } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { readAsStringAsync } from 'expo-file-system/legacy';
import React from 'react';

import { invalidatePodcastLibrary } from '@/query-manager/podcasts';
import type { ImportResult } from '@/features/podcasts/utils/import-summary';
import { importAntennaPodBackup, type ImportProgress } from '@/services/podcasts/antennapod-import';
import { importOpml, parseOpml } from '@/services/podcasts/opml';
import { refreshAllShows } from '@/services/podcasts/refresh';
import { usePodcastPrefs } from '@/stores/podcast-prefs';
import { haptics } from '@/utils/haptics';


export type ImportState =
  | { phase: 'idle' }
  | { phase: 'running'; progress: ImportProgress }
  | { phase: 'done'; result: ImportResult }
  | { phase: 'failed'; message: string };

export type ActiveImport = Exclude<ImportState, { phase: 'idle' }>;

const NOT_AN_EXPORT = 'Choose the database export from AntennaPod (a .db file), or an OPML file.';
const MAX_OPML_BYTES = 10 * 1024 * 1024;

/** "SQLite format 3\0", the first sixteen bytes of every SQLite file, in base64. */
const SQLITE_MAGIC = 'U1FMaXRlIGZvcm1hdCAzAA==';

type PickedFile = { uri: string; size: number | null };

/**
 * Reads a chosen file as whichever export it is. Told apart by what is in it,
 * not by its name: a database export starts with SQLite's own signature,
 * whatever the file manager called it, and an OPML file is XML with an
 * `<opml>` root. Anything else is turned away with what to choose instead.
 */
async function importFile(file: PickedFile, onProgress: (progress: ImportProgress) => void): Promise<ImportResult> {
  const head = await readAsStringAsync(file.uri, { encoding: 'base64', position: 0, length: 16 });
  if (head === SQLITE_MAGIC) {
    return { kind: 'database', summary: await importAntennaPodBackup(file.uri, onProgress) };
  }
  // OPML is a short list of addresses. Anything this large is not one, and
  // reading it whole as text would only cost memory to find that out.
  if (file.size != null && file.size > MAX_OPML_BYTES) throw new Error(NOT_AN_EXPORT);
  const text = await readAsStringAsync(file.uri);
  if (!/<opml[\s>]/i.test(text)) throw new Error(NOT_AN_EXPORT);
  const feeds = parseOpml(text);
  if (feeds.length === 0) throw new Error('This OPML file has no podcasts in it.');
  const opml = await importOpml(feeds, onProgress);
  return { kind: 'opml', added: opml.added, failed: opml.failed.length };
}

/**
 * Choosing an AntennaPod export and bringing it in. The import is a mutation;
 * its progress, which the mutation has no slot for, is kept beside it. So is
 * the guide to finding the export, which opens before the file picker does.
 *
 * Once it is in, every imported show is refreshed in the background, so
 * whatever was published since the backup was made turns up on its own.
 */
export function useAntennaPodImport() {
  const [progress, setProgress] = React.useState<ImportProgress>({ done: 0, total: 0, current: null });
  const importing = useMutation({
    mutationFn: (file: PickedFile) => importFile(file, setProgress),
    onSuccess: () => {
      // Felt on the frame the summary lands, since that is what it confirms.
      haptics.commit();
      usePodcastPrefs.getState().set('onboarding', 'imported');
      invalidatePodcastLibrary();
      void refreshAllShows(false);
    },
    onError: () => haptics.warn(),
  });
  const [guideOpen, setGuideOpen] = React.useState(false);

  const start = React.useCallback(async () => {
    if (importing.isPending) return;
    const picked = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true, multiple: false });
    const asset = picked.canceled ? null : picked.assets?.[0];
    if (!asset) return;
    setProgress({ done: 0, total: 0, current: null });
    importing.mutate({ uri: asset.uri, size: asset.size ?? null });
  }, [importing]);

  const state: ImportState = importing.isPending
    ? { phase: 'running', progress }
    : importing.isSuccess
      ? { phase: 'done', result: importing.data }
      : importing.isError
        ? { phase: 'failed', message: importing.error.message || 'The import did not finish.' }
        : { phase: 'idle' };

  const openGuide = React.useCallback(() => setGuideOpen(true), []);
  const closeGuide = React.useCallback(() => setGuideOpen(false), []);
  // The sheet steps aside first, so the picker is not opened over a sheet
  // still on its way down.
  const chooseFromGuide = React.useCallback(() => {
    setGuideOpen(false);
    void start();
  }, [start]);

  /** The import once it has begun, and null while there is none: what `ImportView` draws. */
  const active: ActiveImport | null = state.phase === 'idle' ? null : state;
  return {
    state,
    active,
    start,
    reset: importing.reset,
    openGuide,
    /** Spread onto `ImportGuideSheet`. */
    guide: { visible: guideOpen, onClose: closeGuide, onChoose: chooseFromGuide },
  };
}

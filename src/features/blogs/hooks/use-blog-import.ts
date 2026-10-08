import { useMutation } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { readAsStringAsync } from 'expo-file-system/legacy';
import React from 'react';

import { showToast } from '@/components/toast/toast-provider';
import { importOutcome, importProgressLabel } from '@/features/blogs/utils/import-summary';
import { invalidateBlogLibrary } from '@/query-manager/blogs';
import { parseOpml } from '@/services/feeds/opml';
import { importBlogOpml, type BlogImportResult } from '@/services/blogs/opml';
import { haptics } from '@/utils/haptics';

const TOAST_KEY = 'blog-import';
/** OPML is a short list of addresses; anything this large is not one. */
const MAX_OPML_BYTES = 10 * 1024 * 1024;
const NOT_OPML = 'Choose an OPML file, the list of feeds a reader app exports.';

async function readFeeds(uri: string, size: number | null) {
  if (size != null && size > MAX_OPML_BYTES) throw new Error(NOT_OPML);
  const text = await readAsStringAsync(uri);
  if (!/<opml[\s>]/i.test(text)) throw new Error(NOT_OPML);
  const feeds = parseOpml(text);
  if (feeds.length === 0) throw new Error('This OPML file has no feeds in it.');
  return feeds;
}

/**
 * Bringing blogs in from another reader's OPML export. It has no screen of
 * its own: the count runs in a toast, and the toast says what came across
 * and what did not when it lands.
 */
export function useBlogImport() {
  const importing = useMutation({
    mutationFn: async (file: { uri: string; size: number | null }): Promise<BlogImportResult> => {
      const feeds = await readFeeds(file.uri, file.size);
      return importBlogOpml(feeds, (progress) =>
        showToast({ key: TOAST_KEY, message: importProgressLabel(progress), busy: true }),
      );
    },
    onSuccess: (result) => {
      // Felt on the frame the result lands, since that is what it confirms.
      haptics.commit();
      invalidateBlogLibrary();
      showToast({ key: TOAST_KEY, message: importOutcome(result), tone: result.added > 0 ? 'success' : 'default' });
    },
    onError: (err) => {
      haptics.warn();
      showToast({ key: TOAST_KEY, message: err instanceof Error ? err.message : 'The file could not be read.' });
    },
  });

  // `mutate` is stable; the result object around it is not.
  const { mutate, isPending } = importing;
  const start = React.useCallback(async () => {
    if (isPending) return;
    const picked = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true, multiple: false });
    const asset = picked.canceled ? null : picked.assets?.[0];
    if (asset) mutate({ uri: asset.uri, size: asset.size ?? null });
  }, [isPending, mutate]);

  return { start, importing: isPending };
}

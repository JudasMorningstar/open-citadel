import type { UseQueryOptions } from '@tanstack/react-query';

import { deviceModelKeys } from '@/query-manager/device-models/keys';
import { catalogueModel } from '@/services/device-llm/catalogue';
import { remoteUrls } from '@/services/device-llm/files';
import { totalSizeBytes } from '@/services/huggingface';

type Options<T> = Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'>;

/**
 * What a brain weighs, in bytes.
 *
 * Fresh forever: the catalogue pins every file to a release tag, and a file
 * at a tag does not change size. What this buys over the plain call it
 * replaces is the failure case. That was one attempt at launch, for the
 * active brain only, so a cold start before the network was up left the
 * Samwell card without a size until the picker happened to measure again.
 * Here a miss is retried with backoff, one request is shared by every
 * surface asking, and an unanswered size is asked again whenever something
 * showing it mounts or the app comes back to the front.
 *
 * A total it cannot make is an error rather than `null`, so it is retried
 * like one. The model store keeps what this finds (see `recordModelSize`),
 * which is what the memory and storage checks read.
 */
export function createModelSizeQueryOptions(id: string, options?: Options<number>) {
  return {
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 3,
    ...options,
    queryKey: deviceModelKeys.size(id),
    queryFn: async () => {
      const entry = catalogueModel(id);
      if (!entry) throw new Error(`No brain called ${id} in the catalogue.`);
      const bytes = await totalSizeBytes(remoteUrls(entry));
      if (bytes == null) throw new Error(`Could not measure ${entry.name}.`);
      return bytes;
    },
  } satisfies UseQueryOptions<number, Error>;
}

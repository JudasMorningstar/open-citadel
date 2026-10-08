import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { createModelSizeQueryOptions } from '@/query-manager/device-models';
import { useModelStore, type LocalModel } from '@/stores/model';

/**
 * A brain's size for a surface that shows it, asked for while it is shown.
 *
 * Usually already known: measured at launch and kept on the brain's row. When
 * it is not (launch was offline, or Hugging Face was slow), this asks again
 * through the query cache, which retries, shares the request with anything
 * else asking, and asks once more when the app comes back to the front. What
 * it finds goes to the model store, where the memory and storage checks read
 * it.
 */
export function useModelSize(model: LocalModel | undefined): {
  sizeBytes: number | null;
  /** Still asking. Settles to false with no size if Hugging Face never answers. */
  measuring: boolean;
} {
  const id = model?.id ?? '';
  const known = model?.sizeBytes ?? null;
  const asking = id !== '' && known == null;
  const query = useQuery(createModelSizeQueryOptions(id, { enabled: asking }));
  const record = useModelStore((s) => s.recordModelSize);

  React.useEffect(() => {
    if (asking && query.data != null) record(id, query.data);
  }, [asking, id, query.data, record]);

  return {
    sizeBytes: known ?? query.data ?? null,
    measuring: asking && query.data == null && !query.isError,
  };
}

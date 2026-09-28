import { useRouter } from 'expo-router';
import React from 'react';

import { useCollectionsStore } from '@/stores/collections';
import { countLabel, matchesQuery } from '@/utils/format';

/** Collections' "View all": every collection, searchable by name. */
export function useCollectionsSection() {
  const router = useRouter();
  const collections = useCollectionsStore((s) => s.collections);
  const [query, setQuery] = React.useState('');
  const results = React.useMemo(
    () => collections.filter((c) => matchesQuery(query, c.name)),
    [collections, query],
  );
  const openCollection = React.useCallback((id: string) => router.push(`/collection/${id}` as any), [router]);
  const close = React.useCallback(() => router.back(), [router]);

  return {
    subtitle: countLabel(collections.length, 'COLLECTION'),
    query,
    setQuery,
    results,
    emptyText: query ? 'No results.' : 'No collections yet.',
    openCollection,
    close,
  };
}

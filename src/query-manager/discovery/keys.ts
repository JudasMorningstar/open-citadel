/** Apple's directory: the charts and search. Network reads, cached by time. */
export const discoveryKeys = {
  all: ['discovery'] as const,
  chart: (genreId: number | null, limit: number) => [...discoveryKeys.all, 'chart', genreId ?? 'all', limit] as const,
  search: (term: string) => [...discoveryKeys.all, 'search', term] as const,
};

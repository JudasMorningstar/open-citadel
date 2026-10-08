/** What is on sale and what each plan holds. Neither is about a person. */
export const billingKeys = {
  all: ['billing'] as const,
  /** The store's offering: the packages and their localised prices. */
  offering: () => [...billingKeys.all, 'offering'] as const,
  /** `/billing/plans`: model counts and the catalogue, for the cards. */
  planPreview: () => [...billingKeys.all, 'plan-preview'] as const,
};

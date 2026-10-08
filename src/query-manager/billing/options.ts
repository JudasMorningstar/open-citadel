import type { UseQueryOptions } from '@tanstack/react-query';
import type { PurchasesOffering } from 'react-native-purchases';

import { billingKeys } from '@/query-manager/billing/keys';
import { fetchPlanPreview, type PlanPreview } from '@/services/billing-plans';
import { getOffering } from '@/services/purchases';

type Options<T> = Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'>;

/*
 * Prices and plan contents change when somebody edits a store listing or the
 * catalogue, not while a reader is looking. An hour fresh, so the carousel
 * opens on what is already here every time after the first; kept for a day.
 */
const HOUR = 60 * 60_000;

/**
 * The plans on sale, from RevenueCat's SDK.
 *
 * An SDK call rather than a fetch, and TanStack Query does not mind: a query
 * is any promise. What it adds is one answer shared by every surface that
 * sells a plan, a prefetch at launch (see `prefetchPlanOffer`), and a retry
 * with a way to ask again, none of which the SDK call has alone.
 */
export function createOfferingQueryOptions(options?: Options<PurchasesOffering>) {
  return {
    staleTime: HOUR,
    gcTime: 24 * HOUR,
    retry: 2,
    ...options,
    queryKey: billingKeys.offering(),
    queryFn: async () => {
      /*
       * No offering is a failure, not an answer. Play Billing can come back
       * empty for a moment at launch, and cached as a success that would be
       * an hour of cards with no prices and no way to ask again.
       */
      const offering = await getOffering();
      if (!offering) throw new Error('The store has no plans on sale right now.');
      return offering;
    },
  } satisfies UseQueryOptions<PurchasesOffering, Error>;
}

/** What each plan holds: the cards' model counts and the info sheets' list. */
export function createPlanPreviewQueryOptions(options?: Options<PlanPreview>) {
  return {
    staleTime: HOUR,
    gcTime: 24 * HOUR,
    retry: 2,
    ...options,
    queryKey: billingKeys.planPreview(),
    queryFn: ({ signal }) => fetchPlanPreview(signal),
  } satisfies UseQueryOptions<PlanPreview, Error>;
}

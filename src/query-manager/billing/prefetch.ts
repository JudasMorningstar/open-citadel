import { PURCHASES_ENABLED } from '@/constants/revenuecat';
import { queryClient } from '@/lib/query-client';
import {
  createOfferingQueryOptions,
  createPlanPreviewQueryOptions,
} from '@/query-manager/billing/options';

/**
 * The plan carousel's loader: both of its answers, asked for at launch.
 *
 * Called the moment the purchases SDK is configured, which is the earliest
 * the offering can be asked for. By the time anybody opens the cloud panel
 * the cache already holds the prices and the counts, so the carousel draws
 * whole on its first frame and its skeleton is only ever seen on a slow
 * connection. A failure here is quiet: the carousel asks again, and shows
 * its own way out if that fails too.
 */
export function prefetchPlanOffer(): void {
  if (PURCHASES_ENABLED) void queryClient.prefetchQuery(createOfferingQueryOptions());
  void queryClient.prefetchQuery(createPlanPreviewQueryOptions());
}

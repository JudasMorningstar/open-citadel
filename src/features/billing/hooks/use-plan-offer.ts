import { useQuery } from '@tanstack/react-query';
import React from 'react';
import type { PurchasesPackage } from 'react-native-purchases';
import { planForPackage, type PlanId } from 'samwell-shared';

import { PURCHASES_ENABLED } from '@/constants/revenuecat';
import {
  createOfferingQueryOptions,
  createPlanPreviewQueryOptions,
} from '@/query-manager/billing';
import type { PlanModel } from '@/stores/subscription';

const NO_COUNTS: Record<PlanId, number> = { maester: 0, grand_maester: 0, archmaester: 0 };

export type PlanOffer = {
  /** The store package behind each plan, keyed exactly. See `planForPackage`. */
  packages: Partial<Record<PlanId, PurchasesPackage>>;
  /** How many models each plan opens up, or zeros if the server never said. */
  modelCounts: Record<PlanId, number>;
  /** Every model with its tier, for the plan info sheets. */
  catalogue: PlanModel[];
  /**
   * Everything the cards say is in hand, so they can be drawn whole.
   *
   * The cards used to draw at once and fill in as answers arrived: a price
   * shimmering, then the price, then a "brains" line pushing the card taller
   * when the server caught up. Three arrivals is a card that glitches. Held
   * until both are in, the carousel goes from its skeleton to the finished
   * cards in one dissolve.
   */
  ready: boolean;
  /** The store could not be reached for prices, even after retrying. */
  failed: boolean;
  retry: () => void;
};

/**
 * The plans on sale and what each one holds, for the plan carousel.
 *
 * Both answers come from TanStack Query and are usually already cached: the
 * account store prefetches them the moment the purchases SDK is configured
 * (`prefetchPlanOffer`), so on most opens this returns `ready` on its first
 * render and no skeleton is drawn at all.
 *
 * `enabled` waits for the identity to settle, because the account store is
 * what configures the purchases SDK and asking before it throws.
 */
export function usePlanOffer(enabled: boolean): PlanOffer {
  const offering = useQuery(createOfferingQueryOptions({ enabled: enabled && PURCHASES_ENABLED }));
  const preview = useQuery(createPlanPreviewQueryOptions({ enabled }));

  const packages = React.useMemo(() => {
    const out: Partial<Record<PlanId, PurchasesPackage>> = {};
    for (const pkg of offering.data?.availablePackages ?? []) {
      const plan = planForPackage(pkg.identifier);
      if (plan) out[plan] = pkg;
    }
    return out;
  }, [offering.data]);

  const { refetch: refetchOffering } = offering;
  const { refetch: refetchPreview } = preview;
  const retry = React.useCallback(() => {
    void refetchOffering();
    void refetchPreview();
  }, [refetchOffering, refetchPreview]);

  return {
    packages,
    modelCounts: preview.data?.modelsByPlan ?? NO_COUNTS,
    catalogue: preview.data?.catalogue ?? [],
    // The counts are a nicety: a server that cannot say them does not hold
    // the prices back. Settled either way is enough.
    ready: offering.isSuccess && !preview.isPending,
    failed: offering.isError,
    retry,
  };
}

import React from "react";
import { View, useWindowDimensions } from "react-native";
import type { PurchasesPackage } from "react-native-purchases";
import { useCSSVariable } from "uniwind";

import { Handover } from "@/components/navigation/handover";
import { ThemedText } from "@/components/themed-text";
import { GoldButton } from "@/components/ui/gold-button";
import { Spinner } from "@/components/ui/spinner";
import { Touchable } from "@/components/ui/touchable";
import { PlanCarouselSkeleton } from "@/features/billing/components/plan-carousel-skeleton";
import { PlanOfferFailed } from "@/features/billing/components/plan-offer-failed";
import { PlanInfoSheet } from "@/features/billing/components/plan-info-sheet";
import { PlanRun } from "@/features/billing/components/plan-run";
import { SubscriptionLegalLinks } from "@/features/billing/components/subscription-legal-links";
import { formatStorePrice } from "@/features/billing/utils/price";
import type { PlanModel } from "@/stores/subscription";
import { asColor } from "@/utils/colors";
import { haptics } from "@/utils/haptics";
import {
    CREDIT_PLANS,
    PLANS,
    type CreditPlan,
    type PlanId,
} from "samwell-shared";

/**
 * Every slide is absolutely positioned, so `Carousel.Content` has to be told
 * a height - it has no children in the layout flow to take one from. Same
 * constraint the Compass log deck documents.
 *
 * The number is the tallest card's content, summed from the theme's tokens so
 * it can be checked rather than believed. Two rows wrap and the sum holds
 * them: "6 models to choose from" runs to two lines at the tick row's width
 * (seen on device), and the Grand Maester name takes two beside the badge:
 *
 *   32  `p-4`, top and bottom
 *   40  title row - the Grand Maester name's two `bodySm` lines
 *   16  gap-4
 *   36  price row (`headlineLg`'s line)
 *   16  gap-4
 *   24  credits row (`bodyMd`'s line)
 *  + 8 + 40 + 8 + 20   models on two lines, then rollover, with `gap-2`
 *   16  `p-4` bottom
 *    2  the card's own 1px borders
 *  ────
 *  242
 *
 * A base, not the answer. `allowFontScaling` is on by default, so lines
 * measured at the default type size is the wrong height for somebody running
 * large text - and a fixed height does not clip gracefully, it just cuts the
 * last line off. Scaled by the live font scale below.
 */
const BASE_CARD_HEIGHT = 242;

/**
 * Past double, scaling the box further stops helping.
 *
 * The card would be taller than most screens and the run would have nothing
 * left to peek. Two lines of the copy wrapping inside a box this tall is a
 * far better outcome than a card nobody can swipe past.
 */
const MAX_FONT_SCALE = 2;

/** Under the panel width, so the neighbours peek. The peek is what says
 * there are two more. */
const CARD_WIDTH = 232;

export type PlanCarouselProps = {
  /** Store packages keyed by plan, or empty while the offering loads. */
  packages: Partial<Record<PlanId, PurchasesPackage>>;
  /** The whole catalogue with tiers and credit estimates, for the info
   * sheets. Empty against an older server; the sheets then say counts. */
  catalogue: PlanModel[];
  /** How many models each plan opens up. */
  modelCounts: Record<PlanId, number>;
  busy: PlanId | "restore" | "manage" | null;
  /**
   * Everything the cards say is in hand. Until then the run is its skeleton,
   * so the cards arrive whole rather than filling in piece by piece. See
   * `usePlanOffer`. The skeleton is also what is drawn first when this is
   * true from the start: see the note on `PlanCarousel`.
   */
  ready?: boolean;
  /** The prices could not be had. The run gives way to a way to ask again. */
  failed?: boolean;
  onRetry?: () => void;
  onChoose: (plan: PlanId, packageToBuy: PurchasesPackage) => void;
  onSelectionChange?: (plan: PlanId) => void;
  onRestore?: () => void;
  /** A subset for plan changes. The initial purchase flow shows all plans. */
  plans?: CreditPlan[];
  /** The card the run rests on when it opens. */
  initialPlanId?: PlanId;
  /** Upgrade sheets do not repeat the restore escape hatch. */
  showRestore?: boolean;
  /** Plan-change sheets pin their action outside the scrolling region. */
  showAction?: boolean;
  actionVerb?: "CHOOSE" | "UPGRADE TO" | "DOWNGRADE TO";
  /** The ground the edge fades blend into. Sheets are `popover`. */
  surface?: "background" | "popover";
  /**
   * The gutter of the page the run sits in. The track reaches past it to the
   * screen edge, so the fade starts at the edge rather than a gutter inside
   * it; the button and restore row stay in the column.
   */
  bleed?: number;
};

/**
 * The plans on sale: the run of cards, the one commit under it, and the way
 * to restore.
 *
 * The run itself is `PlanRun`, and it is the one expensive thing here: a
 * gesture, a track, three animated slides and their edge fades. Mounted in
 * the same pass as everything around it, it held up the frame that answers
 * the tap: choosing Cloud in Settings did nothing visible until the whole run
 * had been built, and with the prices already cached there was no skeleton in
 * between to draw first. So the run sits in a `Handover`: the heading, the
 * skeleton and the button are drawn at once, the cards mount on the frame
 * after and dissolve in over the skeleton, whose edges are where theirs are.
 *
 * The edge fades blend into `surface` and start at the screen edge only when
 * `bleed` cancels the page gutter.
 */
export function PlanCarousel({
  packages,
  catalogue,
  modelCounts,
  busy,
  ready = true,
  failed = false,
  onRetry,
  onChoose,
  onSelectionChange,
  onRestore,
  plans = PLANS,
  initialPlanId = "grand_maester",
  showRestore = true,
  showAction = true,
  actionVerb = "CHOOSE",
  surface = "popover",
  bleed = 0,
}: PlanCarouselProps) {
  const mutedForeground = useCSSVariable("--color-muted-foreground");
  const initialIndex = Math.max(
    0,
    plans.findIndex((plan) => plan.id === initialPlanId),
  );
  const [active, setActive] = React.useState(initialIndex);
  /** Which plan's explanation sheet is open, if any. One sheet, three keys. */
  const [infoPlanId, setInfoPlanId] = React.useState<PlanId | null>(null);
  // Reactive rather than read once: the setting can change while the app is
  // open, and `PixelRatio.getFontScale()` at module load would never notice.
  const { fontScale } = useWindowDimensions();
  const contentStyle = React.useMemo(
    () => ({
      height: Math.round(
        BASE_CARD_HEIGHT * Math.min(Math.max(1, fontScale), MAX_FONT_SCALE),
      ),
    }),
    [fontScale],
  );

  /*
   * The snap is a selection moving, which is what the house reserves
   * `select` for. It fires on the settled index rather than during the drag,
   * so the buzz lands with the card arriving and not under the finger.
   */
  const handleIndexChange = React.useCallback(
    (next: number) => {
      setActive(next);
      const nextPlan = plans[next];
      if (nextPlan) onSelectionChange?.(nextPlan.id);
      haptics.select();
    },
    [onSelectionChange, plans],
  );

  const choose = React.useCallback(
    (plan: PlanId) => {
      const packageToBuy = packages[plan];
      if (!packageToBuy) return;
      haptics.commit();
      onChoose(plan, packageToBuy);
    },
    [packages, onChoose],
  );

  /*
   * The store's own localised string for each plan, or nothing at all.
   *
   * It used to fall back to the plan's own `priceUsd` while the offering
   * loaded, which drew a real-looking price that nobody was being charged:
   * wrong currency outside the US, and wrong everywhere the moment a store
   * price changes, since that constant is only what the product was set up
   * as. A card with no price shows a waiting shimmer instead, and the CHOOSE
   * button is already disabled until the packages arrive, so no purchase can
   * start from a price that was never quoted.
   *
   * The string loses its country qualifier and its exactly-zero cents: "$20",
   * not "US$20.00" - see `formatStorePrice`.
   */
  const prices = React.useMemo(() => {
    const out: Partial<Record<PlanId, string>> = {};
    for (const plan of plans) {
      const priceString = packages[plan.id]?.product.priceString;
      if (priceString) out[plan.id] = formatStorePrice(priceString);
    }
    return out;
  }, [packages, plans]);

  const bleedStyle = React.useMemo(
    () => ({ marginHorizontal: -bleed }),
    [bleed],
  );
  const columnStyle = React.useMemo(
    () => ({ marginHorizontal: bleed }),
    [bleed],
  );
  // The prices could not be had and are not being asked for again.
  const offerFailed = failed && !ready;

  const nothingToBuy = Object.keys(packages).length === 0;
  // The run is bounded to three, but an index arriving from a gesture is not
  // something to take on trust when it indexes an array.
  const activePlan =
    plans[Math.min(Math.max(0, active), plans.length - 1)] ?? PLANS[0];

  return (
    <View className="gap-4">
      <View style={bleedStyle}>
        {offerFailed ? (
          // In the column rather than bled to the screen edges.
          <View style={columnStyle}>
            <PlanOfferFailed onRetry={onRetry} />
          </View>
        ) : (
          <Handover
            fill={false}
            ready={ready}
            surface={surface}
            skeleton={
              <PlanCarouselSkeleton
                cardWidth={CARD_WIDTH}
                height={contentStyle.height}
                count={plans.length}
                resting={initialIndex}
              />
            }
          >
            <PlanRun
              plans={plans}
              initialIndex={initialIndex}
              active={active}
              cardWidth={CARD_WIDTH}
              contentStyle={contentStyle}
              prices={prices}
              modelCounts={modelCounts}
              surface={surface}
              onIndexChange={handleIndexChange}
              onInfo={setInfoPlanId}
            />
          </Handover>
        )}
      </View>

      {/* One commit, in a fixed place, naming what it will buy. Gold appears
          once per screen and never moves; the run is what selects. A label
          that says which plan is also the difference between a button a
          screen reader can announce and three that all say "choose". */}
      {showAction ? (
        <View>
          <GoldButton
            label={`${actionVerb} ${activePlan.label.toUpperCase()}`}
            size="full"
            loading={busy === activePlan.id}
            disabled={nothingToBuy || busy !== null}
            onPress={() => choose(activePlan.id)}
          />
        </View>
      ) : null}

      {/*
       * Restore, as Apple draws it on its own subscription screens: a quiet,
       * centred text row. The bordered chip treatment competed with the gold
       * commit above it for weight, and a secondary escape hatch must not
       * out-shout the thing it sits under. Press feedback and the haptic stay
       * - quiet is not inert (§1, §13). The two waits land below the row, on
       * its own line, so their comings and goings never move the centred
       * label a pixel.
       */}
      {showRestore && onRestore ? (
        <View className="items-center">
          <Touchable
            className="px-4 py-2"
            onPress={onRestore}
            disabled={busy !== null}
            haptic="select"
            accessibilityRole="button"
            accessibilityLabel="Restore purchases"
          >
            <ThemedText
              type="labelSm"
              color={asColor(mutedForeground)}
              className="tracking-[1px]"
            >
              RESTORE PURCHASES
            </ThemedText>
          </Touchable>
        </View>
      ) : null}
      {/* Only the restore's own wait. A background balance check used to
          show a spinner here too, coming and going under the run on every
          visit; the skeleton above is the one loading state now. */}
      {showRestore && onRestore && busy === "restore" ? (
        <View className="items-center">
          <Spinner size="sm" label="Looking for your subscription" />
        </View>
      ) : null}

      {/*
       * Every plan picker sells a subscription, including the upgrade sheet
       * whose button lives in its footer, so App Review wants the terms here.
       */}
      <SubscriptionLegalLinks />

      {/*
       * One sheet for the run. It opens on the card whose mark was tapped,
       * not on the resting card - a neighbour's i is a neighbour's question.
       */}
      {infoPlanId ? (
        <PlanInfoSheet
          visible
          onClose={() => setInfoPlanId(null)}
          plan={CREDIT_PLANS[infoPlanId]}
          models={catalogue}
          modelCount={modelCounts[infoPlanId] ?? 0}
        />
      ) : null}
    </View>
  );
}

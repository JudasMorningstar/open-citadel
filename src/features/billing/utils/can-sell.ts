import { ACCOUNT_ENABLED } from '@/constants/logto';
import { PURCHASES_ENABLED } from '@/constants/revenuecat';

/**
 * This build can take a payment for a plan.
 *
 * What decides whether a wall opens the plans sheet over itself or sends the
 * reader to Settings, which is the screen that explains a build that cannot
 * sell anything.
 */
export const CAN_SELL_PLANS = PURCHASES_ENABLED && ACCOUNT_ENABLED;

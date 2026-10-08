import { queryClient } from '@/lib/query-client';
import { createDeviceVoicesQueryOptions } from '@/query-manager/device-voices/options';

/**
 * Asks for the phone's voices before anybody opens the list.
 *
 * Called when the reading voice settings appear, whichever kind of voice is
 * chosen, so that by the time the phone voices are picked the list is already
 * here and the sheet opens straight onto it.
 */
export function prefetchDeviceVoices(): void {
  void queryClient.prefetchQuery(createDeviceVoicesQueryOptions());
}

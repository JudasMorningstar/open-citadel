import type { UseQueryOptions } from '@tanstack/react-query';

import { deviceVoiceKeys } from '@/query-manager/device-voices/keys';
import { deviceSpeech, listDeviceVoices } from '@/services/device-tts/speech';
import type { DeviceVoice } from '@/utils/device-voices';

type Options<T> = Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'>;

const MINUTE = 60_000;

/**
 * The phone's voices, asked for once and kept for the session.
 *
 * The list only changes when somebody installs voice data in the phone's own
 * settings, so it is held for as long as the app runs and counts as fresh for
 * five minutes. Opening the voice settings after that shows what is cached and
 * asks again behind it, which is quick once the speech service is bound.
 *
 * It is the phone answering, not the network, so it must run offline too.
 */
export function createDeviceVoicesQueryOptions(options?: Options<DeviceVoice[]>) {
  return {
    staleTime: 5 * MINUTE,
    gcTime: Infinity,
    networkMode: 'always',
    retry: 1,
    ...options,
    queryKey: deviceVoiceKeys.list(),
    queryFn: async () => {
      const voices = await listDeviceVoices();
      /*
       * No voices from a phone that has a speech engine is a failure, not an
       * answer: the engine reports an empty list when it did not come up.
       * Cached as a success that would be a session with nothing to pick.
       */
      if (voices.length === 0 && deviceSpeech()) throw new Error('The phone has no voices to offer right now.');
      return voices;
    },
  } satisfies UseQueryOptions<DeviceVoice[], Error>;
}

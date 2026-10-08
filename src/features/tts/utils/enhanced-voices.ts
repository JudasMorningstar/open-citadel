import type { DeviceVoice, DeviceVoiceRow } from '@/utils/device-voices';

/** How a voice is named and described. The catalogue's own two functions, handed in. */
export type VoiceNaming<V extends string> = {
  label: (voice: V) => string;
  descriptor: (voice: V) => string;
};

/**
 * An Enhanced voice in the shape the voice list draws, so the Lite and the
 * Enhanced voices share one list. Its character ("Clear, polished") takes the
 * line a phone voice gives to its language.
 *
 * The naming is handed in so this stays free of the catalogue, which loads
 * the phone's native modules and cannot be imported by a test.
 */
export function enhancedVoiceEntry<V extends string>(voice: V, naming: VoiceNaming<V>): DeviceVoice {
  return { identifier: voice, name: naming.label(voice), language: naming.descriptor(voice), quality: '' };
}

/** One voice box's voices as rows of the voice list, in the box's own order. */
export function enhancedVoiceRows<V extends string>(voices: readonly V[], naming: VoiceNaming<V>): DeviceVoiceRow[] {
  return voices.map((voice) => ({ kind: 'voice', key: voice, voice: enhancedVoiceEntry(voice, naming) }));
}
